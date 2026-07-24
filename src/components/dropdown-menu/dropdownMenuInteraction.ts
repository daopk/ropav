import { computed, watch } from 'vue';
import type {
    DropdownMenuCloseOptions,
    DropdownMenuFocusTarget,
    DropdownMenuOpenOptions,
} from './types';
import {
    createDropdownMenuInteractionNavigation,
    type DropdownMenuInteractionNavigation,
} from './dropdownMenuInteractionNavigation';
import {
    createDropdownMenuInteractionRegistry,
    type DropdownMenuInteractionRegistry,
} from './dropdownMenuInteractionRegistry';
import type {
    DropdownMenuInteraction,
    DropdownMenuInteractionFocusTarget,
    DropdownMenuInteractionItem,
    DropdownMenuInteractionItemOptions,
    DropdownMenuInteractionMenu,
    DropdownMenuInteractionMenuOptions,
    DropdownMenuInteractionHost,
    DropdownMenuInteractionSubmenu,
    DropdownMenuInteractionSubmenuOptions,
} from './dropdownMenuInteractionTypes';
import { useDropdownMenuInteractionDismissal } from './useDropdownMenuInteractionDismissal';
import { useDropdownMenuInteractionKeyboard } from './useDropdownMenuInteractionKeyboard';

export type {
    DropdownMenuInteractionDismissalRegistration,
    DropdownMenuInteraction,
    DropdownMenuInteractionFocusTarget,
    DropdownMenuInteractionHost,
    DropdownMenuInteractionItem,
    DropdownMenuInteractionItemOptions,
    DropdownMenuInteractionMenu,
    DropdownMenuInteractionMenuOptions,
    DropdownMenuInteractionSubmenu,
    DropdownMenuInteractionSubmenuOptions,
} from './dropdownMenuInteractionTypes';

function resolveOpenFocusTarget(
    options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget,
): DropdownMenuFocusTarget {
    if (typeof options === 'string') return options;
    return options?.focus ?? 'first';
}

function resolveKeyboardMenuId(
    rootMenuId: string,
    registry: DropdownMenuInteractionRegistry,
    event: KeyboardEvent,
) {
    const activeItemId = registry.activeItemId.value;
    const activeItem = activeItemId ? registry.getItem(activeItemId) : undefined;
    const openSubmenuId = activeItem?.submenuId?.();
    if (openSubmenuId && registry.isMenuOpen(openSubmenuId)) {
        if (event.key === 'Escape') return openSubmenuId;

        const opensLeft =
            activeItem?.submenuDirection?.() === 'left' ||
            registry.getMenu(openSubmenuId)?.placement().startsWith('left');
        if (event.key === (opensLeft ? 'ArrowRight' : 'ArrowLeft')) return openSubmenuId;
    }

    if (
        ['ArrowLeft', 'ArrowRight', 'Escape'].includes(event.key) &&
        registry.activeMenuId.value !== rootMenuId
    ) {
        return registry.activeMenuId.value;
    }
    return activeItem?.menuId ?? registry.activeMenuId.value;
}

export function useDropdownMenuInteraction(
    host: DropdownMenuInteractionHost,
): DropdownMenuInteraction {
    let navigation!: DropdownMenuInteractionNavigation;
    const registry = createDropdownMenuInteractionRegistry(host, {
        closeMenu: (menuId, focusParent) => navigation.closeMenu(menuId, focusParent),
        closeSubmenus: (menuId, exceptMenuId) => navigation.closeSubmenus(menuId, exceptMenuId),
        focusMenu: (menuId, target) => navigation.focusMenu(menuId, target),
        reconcile: (menuId) => navigation.reconcile(menuId),
        reconcileOpenSubmenus: () => navigation.reconcileOpenSubmenus(),
    });

    function open(options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget) {
        if (host.disabled.value) return;
        host.beforeOpen?.();
        registry.pendingRootFocus.value = resolveOpenFocusTarget(options);
        host.setOpen(true);
        navigation.focusMenu(host.rootMenuId, registry.pendingRootFocus.value);
    }

    function close(options: DropdownMenuCloseOptions & { returnFocus?: boolean } = {}) {
        host.beforeClose?.();
        host.setOpen(false);
        registry.pendingRootFocus.value = false;
        navigation.closeAllSubmenus();
        registry.state.clearMenuState(host.rootMenuId);
        registry.activeItemId.value = null;
        registry.activeMenuId.value = host.rootMenuId;
        keyboard.resetTypeahead();
        if (options.focusTrigger || options.returnFocus) host.focusTrigger();
    }

    function toggle() {
        if (host.isOpen.value) close({ returnFocus: true });
        else open();
    }

    function onTriggerClick(beforeToggle?: () => void) {
        beforeToggle?.();
        toggle();
    }

    navigation = createDropdownMenuInteractionNavigation({
        host,
        registry,
        closeRoot: close,
    });
    const keyboard = useDropdownMenuInteractionKeyboard({
        host,
        registry,
        navigation,
        openRoot: open,
        closeRoot: close,
    });
    const dismissal = useDropdownMenuInteractionDismissal({
        host,
        registry,
        closeRoot: close,
    });

    function connectItem(
        menuId: string,
        options: DropdownMenuInteractionItemOptions,
    ): DropdownMenuInteractionItem {
        const registration = {
            id: options.id,
            menuId,
            element: options.element,
            textValue: options.textValue,
            disabled: options.disabled,
            order: options.order,
            submenuId: options.submenu ? () => options.submenu?.id : undefined,
            submenuDirection: options.submenuDirection,
            select: options.select,
            closeOnSelect: options.closeOnSelect,
        };
        const disconnect = registry.registerItem(registration);
        const stopReconciliation = watch(
            [options.disabled, options.element, () => options.submenu?.id],
            () => navigation.reconcile(menuId),
            { flush: 'sync' },
        );
        let disposed = false;

        return {
            active: computed(() => registry.isActive(options.id)),
            submenuOpen: computed(() =>
                options.submenu ? registry.isMenuOpen(options.submenu.id) : false,
            ),
            setActive: (focusElement = false) => registry.setActive(options.id, focusElement),
            openSubmenu: (focus = 'first') => options.submenu?.open(focus) ?? false,
            closeSubmenu: (focusParent = false) => options.submenu?.close(focusParent) ?? false,
            select: (originalEvent) => navigation.selectItem(options.id, originalEvent),
            activate: (originalEvent) => navigation.activateItem(options.id, originalEvent),
            hover(openSubmenu = false) {
                navigation.hoverItem(options.id, openSubmenu);
                return Boolean(options.submenu && registry.isMenuOpen(options.submenu.id));
            },
            dispose() {
                if (disposed) return;
                disposed = true;
                stopReconciliation();
                disconnect();
            },
        };
    }

    function connectMenu(
        id: string,
        options: DropdownMenuInteractionMenuOptions,
        state: {
            parentItemId?: () => string | undefined;
            isOpen: () => boolean;
            setOpen?: (open: boolean) => void;
        },
        getRequestedFocus?: () => DropdownMenuInteractionFocusTarget | undefined,
    ): DropdownMenuInteractionMenu {
        const disconnect = registry.registerMenu({
            id,
            ...options,
            ...state,
        });
        const items = new Set<DropdownMenuInteractionItem>();
        let disposed = false;

        const menu: DropdownMenuInteractionMenu = {
            activeId: registry.getActiveId(id),
            connectItem(itemOptions) {
                const item = connectItem(id, itemOptions);
                const dispose = item.dispose;
                item.dispose = () => {
                    dispose();
                    items.delete(item);
                };
                items.add(item);
                return item;
            },
            clearActive: () => {
                registry.setActive(null);
            },
            focusPending() {
                const pending =
                    id === host.rootMenuId
                        ? registry.pendingRootFocus.value
                        : (getRequestedFocus?.() ?? registry.state.getPendingMenuFocus(id));
                return navigation.focusMenu(id, pending || 'first');
            },
            onKeydown: (event) => keyboard.onMenuKeydown(id, event),
            dispose() {
                if (disposed) return;
                disposed = true;
                for (const item of items) item.dispose();
                disconnect();
            },
        };

        return menu;
    }

    function connectRootMenu(
        options: DropdownMenuInteractionMenuOptions,
    ): DropdownMenuInteractionMenu {
        return connectMenu(host.rootMenuId, options, {
            isOpen: () => host.isOpen.value,
        });
    }

    function connectSubmenu(
        options: DropdownMenuInteractionSubmenuOptions,
    ): DropdownMenuInteractionSubmenu {
        const disconnectState = registry.registerMenuState(options);
        // Item registration may consume registry focus before every lazy child has connected.
        let requestedFocus: DropdownMenuInteractionFocusTarget | undefined;
        const stopStateSync = watch(
            options.isOpen,
            (isOpen) => {
                if (isOpen) return;
                requestedFocus = undefined;
                navigation.closeMenu(options.id, false);
            },
            { flush: 'sync' },
        );
        let content: DropdownMenuInteractionMenu | undefined;
        let disposed = false;

        return {
            id: options.id,
            open(focus = 'first') {
                requestedFocus = focus;
                return navigation.openMenu(options.id, focus);
            },
            close(focusParent = false) {
                requestedFocus = undefined;
                return navigation.closeMenu(options.id, focusParent);
            },
            connectContent(menuOptions) {
                const previous = content;
                content = connectMenu(options.id, menuOptions, options, () => requestedFocus);
                previous?.dispose();
                return content;
            },
            dispose() {
                if (disposed) return;
                disposed = true;
                content?.dispose();
                stopStateSync();
                disconnectState();
            },
        };
    }

    function connectInside(element: Element) {
        dismissal.registerInside(element);
        let connected = true;
        return () => {
            if (!connected) return;
            connected = false;
            dismissal.unregisterInside(element);
        };
    }

    watch(host.disabled, (disabled) => {
        if (disabled) close();
    });
    watch(
        host.isOpen,
        (isOpen) => {
            if (!isOpen) {
                navigation.closeAllSubmenus();
                registry.state.clearMenuState(host.rootMenuId);
                registry.activeItemId.value = null;
                registry.activeMenuId.value = host.rootMenuId;
                keyboard.resetTypeahead();
                return;
            }

            const focus = registry.pendingRootFocus.value || 'first';
            navigation.focusMenu(host.rootMenuId, focus);
        },
        { immediate: true },
    );

    return {
        activeItemId: registry.activeItemId,
        connectRootMenu,
        connectSubmenu,
        connectInside,
        connectDismissal: dismissal.registerDismissal,
        open,
        close,
        toggle,
        onTriggerClick,
        onTriggerKeydown: keyboard.onTriggerKeydown,
        onMenuKeydown: (event) =>
            keyboard.onMenuKeydown(resolveKeyboardMenuId(host.rootMenuId, registry, event), event),
    };
}
