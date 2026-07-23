import { watch } from 'vue';
import type {
    DropdownMenuCloseOptions,
    DropdownMenuFocusTarget,
    DropdownMenuOpenOptions,
} from './types';
import {
    createDropdownMenuInteractionNavigation,
    type DropdownMenuInteractionNavigation,
} from './dropdownMenuInteractionNavigation';
import { createDropdownMenuInteractionRegistry } from './dropdownMenuInteractionRegistry';
import type {
    DropdownMenuInteractionHost,
    DropdownMenuInteractionRuntime,
} from './dropdownMenuInteractionTypes';
import { useDropdownMenuInteractionDismissal } from './useDropdownMenuInteractionDismissal';
import { useDropdownMenuInteractionKeyboard } from './useDropdownMenuInteractionKeyboard';

export type {
    DropdownMenuInteractionDismissalRegistration,
    DropdownMenuInteractionFocusTarget,
    DropdownMenuInteractionHost,
    DropdownMenuInteractionItemRegistration,
    DropdownMenuInteractionMenuRegistration,
    DropdownMenuInteractionMenuStateRegistration,
    DropdownMenuInteractionRuntime,
} from './dropdownMenuInteractionTypes';

function resolveOpenFocusTarget(
    options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget,
): DropdownMenuFocusTarget {
    if (typeof options === 'string') return options;
    return options?.focus ?? 'first';
}

export function useDropdownMenuInteraction(
    host: DropdownMenuInteractionHost,
): DropdownMenuInteractionRuntime {
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
        rootMenuId: host.rootMenuId,
        activeItemId: registry.activeItemId,
        activeMenuId: registry.activeMenuId,
        pendingRootFocus: registry.pendingRootFocus,
        registerMenu: registry.registerMenu,
        unregisterMenu: registry.unregisterMenu,
        registerMenuState: registry.registerMenuState,
        registerItem: registry.registerItem,
        unregisterItem: registry.unregisterItem,
        registerInside: dismissal.registerInside,
        unregisterInside: dismissal.unregisterInside,
        registerDismissal: dismissal.registerDismissal,
        getActiveId: registry.getActiveId,
        getItem: registry.getItem,
        getMenu: registry.getMenu,
        isActive: registry.isActive,
        isMenuOpen: registry.isMenuOpen,
        setActive: registry.setActive,
        focusMenu: navigation.focusMenu,
        focusMenuElement: registry.focusMenuElement,
        open,
        close,
        toggle,
        openMenu: navigation.openMenu,
        closeMenu: navigation.closeMenu,
        closeSubmenus: navigation.closeSubmenus,
        selectItem: navigation.selectItem,
        activateItem: navigation.activateItem,
        hoverItem: navigation.hoverItem,
        reconcile: navigation.reconcile,
        onTriggerClick,
        onTriggerKeydown: keyboard.onTriggerKeydown,
        onMenuKeydown: keyboard.onMenuKeydown,
    };
}
