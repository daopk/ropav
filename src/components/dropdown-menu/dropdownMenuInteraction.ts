import {
    computed,
    isRef,
    nextTick,
    onBeforeUnmount,
    ref,
    watch,
    type ComputedRef,
    type Ref,
} from 'vue';
import { useTypeahead } from '@/internal/composables/useTypeahead';
import {
    createCancelableCustomEvent,
    isEventWithinElement,
    isEventWithinTargets,
} from '@/utils/dom/events';
import type {
    DropdownMenuCloseOptions,
    DropdownMenuFocusTarget,
    DropdownMenuInteractOutsideEvent,
    DropdownMenuInteractOutsideTarget,
    DropdownMenuOpenOptions,
    DropdownMenuPlacement,
    DropdownMenuSelectEvent,
} from './types';

export type DropdownMenuInteractionFocusTarget = DropdownMenuFocusTarget | false;

export interface DropdownMenuInteractionMenuRegistration {
    id: string;
    parentItemId?: () => string | undefined;
    element: () => HTMLElement | null;
    focusTarget?: () => HTMLElement | null;
    placement: () => DropdownMenuPlacement;
    isOpen: () => boolean;
    setOpen?: (open: boolean) => void;
    stopKeyPropagation?: boolean;
    onEscape?: (event: KeyboardEvent) => boolean;
}

export interface DropdownMenuInteractionMenuStateRegistration {
    id: string;
    isOpen: () => boolean;
    setOpen: (open: boolean) => void;
}

export interface DropdownMenuInteractionItemRegistration {
    id: string;
    menuId: string;
    element: () => HTMLElement | null;
    textValue: () => string;
    disabled: () => boolean;
    order?: () => number;
    submenuId?: () => string | undefined;
    submenuDirection?: () => 'left' | 'right';
    select?: (originalEvent: Event) => DropdownMenuSelectEvent | undefined;
    closeOnSelect?: () => boolean;
}

export interface DropdownMenuInteractionDismissalRegistration {
    ignoredTargets: () => readonly DropdownMenuInteractOutsideTarget[];
    pointerDownOutside?: (event: DropdownMenuInteractOutsideEvent) => void;
    focusOutside?: (event: DropdownMenuInteractOutsideEvent) => void;
    interactOutside?: (event: DropdownMenuInteractOutsideEvent) => void;
}

export interface DropdownMenuInteractionHost {
    rootMenuId: string;
    isOpen: Readonly<Ref<boolean>>;
    disabled: Readonly<Ref<boolean>>;
    modal: Readonly<Ref<boolean>>;
    setOpen: (open: boolean) => void;
    isTopLayer: () => boolean;
    focusTrigger: () => void;
    beforeOpen?: () => void;
    beforeClose?: () => void;
}

export interface DropdownMenuInteractionRuntime {
    rootMenuId: string;
    activeItemId: Readonly<Ref<string | null>>;
    activeMenuId: Readonly<Ref<string>>;
    pendingRootFocus: Ref<DropdownMenuInteractionFocusTarget>;
    registerMenu: (registration: DropdownMenuInteractionMenuRegistration) => () => void;
    unregisterMenu: (id: string) => void;
    registerMenuState: (registration: DropdownMenuInteractionMenuStateRegistration) => () => void;
    registerItem: (registration: DropdownMenuInteractionItemRegistration) => () => void;
    unregisterItem: (id: string) => void;
    registerInside: (element: Element) => void;
    unregisterInside: (element: Element) => void;
    registerDismissal: (registration: DropdownMenuInteractionDismissalRegistration) => () => void;
    getActiveId: (menuId: string) => ComputedRef<string | null>;
    getItem: (id: string) => DropdownMenuInteractionItemRegistration | undefined;
    getMenu: (id: string) => DropdownMenuInteractionMenuRegistration | undefined;
    isActive: (id: string) => boolean;
    isMenuOpen: (menuId: string) => boolean;
    setActive: (id: string | null, focusElement?: boolean) => boolean;
    focusMenu: (menuId: string, target?: DropdownMenuFocusTarget) => boolean;
    focusMenuElement: (menuId: string) => void;
    open: (options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget) => void;
    close: (options?: DropdownMenuCloseOptions & { returnFocus?: boolean }) => void;
    toggle: () => void;
    openMenu: (menuId: string, focus?: DropdownMenuInteractionFocusTarget) => boolean;
    closeMenu: (menuId: string, focusParent?: boolean) => boolean;
    closeSubmenus: (menuId: string, exceptMenuId?: string) => void;
    selectItem: (id: string, originalEvent?: Event) => void;
    activateItem: (id: string, originalEvent?: Event) => void;
    hoverItem: (id: string, openSubmenu?: boolean) => void;
    reconcile: (menuId?: string) => void;
    onTriggerClick: (beforeToggle?: () => void) => void;
    onTriggerKeydown: (event: KeyboardEvent, beforeOpen?: () => void) => void;
    onMenuKeydown: (menuId: string, event: KeyboardEvent) => void;
}

function resolveOpenFocusTarget(
    options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget,
): DropdownMenuFocusTarget {
    if (typeof options === 'string') return options;
    return options?.focus ?? 'first';
}

function getPlacementSide(placement: DropdownMenuPlacement) {
    return placement.split('-')[0] as 'top' | 'right' | 'bottom' | 'left';
}

function createOutsideEvent(originalEvent: Event): DropdownMenuInteractOutsideEvent {
    return createCancelableCustomEvent(
        'dropdown-menu-interact-outside',
        { originalEvent },
        originalEvent,
    );
}

function blockDocumentClick(event: Event) {
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    document.removeEventListener('click', blockDocumentClick, true);
}

function blockNextDocumentClick() {
    if (typeof document === 'undefined') return;
    document.addEventListener('click', blockDocumentClick, true);
    window.setTimeout(() => document.removeEventListener('click', blockDocumentClick, true), 1000);
}

function compareItems(
    left: DropdownMenuInteractionItemRegistration,
    right: DropdownMenuInteractionItemRegistration,
) {
    const leftElement = left.element();
    const rightElement = right.element();
    if (
        leftElement &&
        rightElement &&
        leftElement !== rightElement &&
        typeof Node !== 'undefined'
    ) {
        const position = leftElement.compareDocumentPosition(rightElement);
        if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
        if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    }

    return (left.order?.() ?? 0) - (right.order?.() ?? 0);
}

function scrollItemIntoView(item: DropdownMenuInteractionItemRegistration) {
    void nextTick(() => item.element()?.scrollIntoView?.({ block: 'nearest' }));
}

export function useDropdownMenuInteraction(
    host: DropdownMenuInteractionHost,
): DropdownMenuInteractionRuntime {
    const menus = new Map<string, DropdownMenuInteractionMenuRegistration>();
    const menuStates = new Map<string, DropdownMenuInteractionMenuStateRegistration>();
    const items = new Map<string, DropdownMenuInteractionItemRegistration>();
    const inside = new Set<Element>();
    const activeIds = ref(new Map<string, string>());
    const activeItemId = ref<string | null>(null);
    const activeMenuId = ref(host.rootMenuId);
    const pendingRootFocus = ref<DropdownMenuInteractionFocusTarget>('first');
    const pendingMenuFocus = new Map<string, DropdownMenuInteractionFocusTarget>();
    let dismissal: DropdownMenuInteractionDismissalRegistration | undefined;
    let isListening = false;

    function getMenu(id: string) {
        return menus.get(id);
    }

    function getItem(id: string) {
        return items.get(id);
    }

    function getItems(menuId: string) {
        // oxlint-disable-next-line unicorn/no-array-sort -- the filtered array is already a copy.
        return [...items.values()].filter((item) => item.menuId === menuId).sort(compareItems);
    }

    function getEnabledItems(menuId: string) {
        return getItems(menuId).filter((item) => !item.disabled());
    }

    function getActiveIdValue(menuId: string) {
        return activeIds.value.get(menuId) ?? null;
    }

    function setActiveId(menuId: string, id: string | null) {
        const next = new Map(activeIds.value);
        if (id) next.set(menuId, id);
        else next.delete(menuId);
        activeIds.value = next;
    }

    function getActiveId(menuId: string) {
        return computed(() => getActiveIdValue(menuId));
    }

    function menuIsOpen(menuId: string) {
        if (menuId === host.rootMenuId) return host.isOpen.value;
        return menuStates.get(menuId)?.isOpen() ?? menus.get(menuId)?.isOpen() ?? false;
    }

    function isMenuOpen(menuId: string) {
        return menuIsOpen(menuId);
    }

    function focusMenuElement(menuId: string) {
        void nextTick(() => {
            const menu = menus.get(menuId);
            (menu?.focusTarget?.() ?? menu?.element())?.focus();
        });
    }

    function setActive(id: string | null, focusElement = false) {
        if (id === null) {
            clearMenuState(activeMenuId.value);
            activeItemId.value = null;
            return true;
        }
        const item = items.get(id);
        if (!item || item.disabled()) return false;
        setActiveId(item.menuId, item.id);
        activeItemId.value = item.id;
        activeMenuId.value = item.menuId;
        pendingMenuFocus.delete(item.menuId);
        if (focusElement) focusMenuElement(item.menuId);
        scrollItemIntoView(item);
        return true;
    }

    function isActive(id: string) {
        return getActiveIdValue(items.get(id)?.menuId ?? '') === id;
    }

    function clearMenuState(menuId: string) {
        const activeId = getActiveIdValue(menuId);
        if (activeId && activeItemId.value === activeId) activeItemId.value = null;
        setActiveId(menuId, null);
    }

    function getParentItem(menuId: string) {
        const parentItemId = menus.get(menuId)?.parentItemId?.();
        if (parentItemId) {
            const parentItem = items.get(parentItemId);
            if (parentItem) return parentItem;
        }
        return [...items.values()].find((item) => item.submenuId?.() === menuId);
    }

    function setMenuOpen(menuId: string, openState: boolean) {
        const state = menuStates.get(menuId);
        if (state) state.setOpen(openState);
        else menus.get(menuId)?.setOpen?.(openState);
    }

    function closeMenu(menuId: string, focusParent = false) {
        const menu = menus.get(menuId);
        const state = menuStates.get(menuId);
        if ((!menu && !state) || menuId === host.rootMenuId) return false;
        const wasOpen = menuIsOpen(menuId);

        closeSubmenus(menuId);
        const shouldRestoreParent = focusParent || activeMenuId.value === menuId;
        if (wasOpen) setMenuOpen(menuId, false);
        pendingMenuFocus.delete(menuId);
        clearMenuState(menuId);

        if (shouldRestoreParent) {
            const parentItem = getParentItem(menuId);
            if (!parentItem || !setActive(parentItem.id, focusParent)) {
                const parentMenuId = parentItem?.menuId ?? host.rootMenuId;
                activeMenuId.value = parentMenuId;
                activeItemId.value = getActiveIdValue(parentMenuId);
                if (focusParent) focusMenuElement(parentMenuId);
            }
        }
        return wasOpen;
    }

    function closeSubmenus(menuId: string, exceptMenuId?: string) {
        for (const item of getItems(menuId)) {
            const submenuId = item.submenuId?.();
            if (!submenuId || submenuId === exceptMenuId) continue;
            closeMenu(submenuId, false);
        }
    }

    function closeAllSubmenus() {
        closeSubmenus(host.rootMenuId);
        const menuIds = new Set([...menus.keys(), ...menuStates.keys()]);
        for (const menuId of menuIds) {
            if (menuId !== host.rootMenuId && menuIsOpen(menuId)) closeMenu(menuId, false);
        }
    }

    function focusMenu(menuId: string, target: DropdownMenuFocusTarget = 'first') {
        const enabledItems = getEnabledItems(menuId);
        const item = target === 'last' ? enabledItems.at(-1) : enabledItems[0];
        focusMenuElement(menuId);
        if (!item) {
            clearMenuState(menuId);
            activeMenuId.value = menuId;
            const parentItem = getParentItem(menuId);
            if (parentItem) activeItemId.value = parentItem.id;
            return false;
        }

        return setActive(item.id);
    }

    function openMenu(menuId: string, focus: DropdownMenuInteractionFocusTarget = 'first') {
        const menu = menus.get(menuId);
        const state = menuStates.get(menuId);
        if ((!menu && !state) || menuId === host.rootMenuId) return false;
        const parentItem = getParentItem(menuId);
        if (!parentItem || parentItem.disabled()) return false;

        closeSubmenus(parentItem.menuId, menuId);
        pendingMenuFocus.set(menuId, focus);
        setMenuOpen(menuId, true);
        if (focus && menu) focusMenu(menuId, focus);
        return true;
    }

    function selectItem(id: string, originalEvent: Event = new Event('select')) {
        const item = items.get(id);
        if (!item || item.disabled()) return;

        const selectEvent = item.select?.(originalEvent);
        if (selectEvent && !selectEvent.defaultPrevented && (item.closeOnSelect?.() ?? true)) {
            close({ focusTrigger: true });
        }
    }

    function activateItem(id: string, originalEvent: Event = new Event('select')) {
        const item = items.get(id);
        if (!item || item.disabled()) return;
        const submenuId = item.submenuId?.();
        if (submenuId) {
            openMenu(submenuId, 'first');
            return;
        }

        selectItem(id, originalEvent);
    }

    function hoverItem(id: string, openSubmenu = false) {
        const item = items.get(id);
        if (!item || item.disabled()) return;
        setActive(id);
        const submenuId = item.submenuId?.();
        if (openSubmenu && submenuId) openMenu(submenuId, false);
        else closeSubmenus(item.menuId, submenuId && menuIsOpen(submenuId) ? submenuId : undefined);
    }

    function chooseNeighbor(menuId: string, previousIndex: number) {
        const currentItems = getItems(menuId);
        const nextCandidates = currentItems.slice(Math.max(0, previousIndex));
        const previousCandidates: DropdownMenuInteractionItemRegistration[] = [];
        for (let index = Math.max(0, previousIndex) - 1; index >= 0; index -= 1) {
            const item = currentItems[index];
            if (item) previousCandidates.push(item);
        }
        const next = [...nextCandidates, ...previousCandidates].find((item) => !item.disabled());
        if (next) setActive(next.id);
        else {
            clearMenuState(menuId);
            focusMenuElement(menuId);
        }
    }

    function reconcileOpenSubmenus() {
        const menuIds = new Set([...menus.keys(), ...menuStates.keys()]);
        for (const menuId of menuIds) {
            if (menuId === host.rootMenuId || !menuIsOpen(menuId)) continue;
            const parentItem = getParentItem(menuId);
            if (!parentItem || parentItem.disabled()) closeMenu(menuId, false);
        }
    }

    function reconcile(menuId?: string) {
        const menuIds = menuId ? [menuId] : [...menus.keys()];
        for (const id of menuIds) {
            const activeId = getActiveIdValue(id);
            if (!activeId) continue;
            const currentItems = getItems(id);
            const activeIndex = currentItems.findIndex((item) => item.id === activeId);
            const activeItem = currentItems[activeIndex];
            if (activeItem && !activeItem.disabled()) continue;
            chooseNeighbor(id, Math.max(0, activeIndex));
        }
        reconcileOpenSubmenus();
    }

    function unregisterItem(id: string) {
        const item = items.get(id);
        if (!item) return;
        const previousItems = getItems(item.menuId);
        const previousIndex = previousItems.findIndex((current) => current.id === id);
        const submenuId = item.submenuId?.();
        if (submenuId) closeMenu(submenuId, false);
        items.delete(id);
        if (getActiveIdValue(item.menuId) === id) {
            chooseNeighbor(item.menuId, previousIndex);
        }
        reconcileOpenSubmenus();
    }

    function registerItem(registration: DropdownMenuInteractionItemRegistration) {
        const previous = items.get(registration.id);
        if (
            previous &&
            previous.menuId !== registration.menuId &&
            getActiveIdValue(previous.menuId) === previous.id
        ) {
            clearMenuState(previous.menuId);
        }
        items.set(registration.id, registration);
        if (
            menuIsOpen(registration.menuId) &&
            !getActiveIdValue(registration.menuId) &&
            !registration.disabled()
        ) {
            const enabledItems = getEnabledItems(registration.menuId);
            const pending = pendingMenuFocus.get(registration.menuId);
            const candidate = pending === 'last' ? enabledItems.at(-1) : enabledItems[0];
            if (candidate) setActive(candidate.id);
        } else {
            reconcile(registration.menuId);
        }

        return () => {
            if (items.get(registration.id) === registration) unregisterItem(registration.id);
        };
    }

    function unregisterMenu(id: string) {
        const menu = menus.get(id);
        if (!menu) return;
        closeSubmenus(id);
        if (id !== host.rootMenuId) closeMenu(id, false);
        clearMenuState(id);
        menus.delete(id);
    }

    function registerMenu(registration: DropdownMenuInteractionMenuRegistration) {
        menus.set(registration.id, registration);
        const pending = pendingMenuFocus.get(registration.id);
        if (registration.isOpen() && pending) {
            void nextTick(() => focusMenu(registration.id, pending));
        }

        return () => {
            if (menus.get(registration.id) !== registration) return;
            unregisterMenu(registration.id);
        };
    }

    function registerMenuState(registration: DropdownMenuInteractionMenuStateRegistration) {
        menuStates.set(registration.id, registration);
        return () => {
            if (menuStates.get(registration.id) !== registration) return;
            menuStates.delete(registration.id);
            pendingMenuFocus.delete(registration.id);
            if (!menus.has(registration.id)) clearMenuState(registration.id);
        };
    }

    const typeaheadMenuId = ref(host.rootMenuId);
    const typeahead = useTypeahead<DropdownMenuInteractionItemRegistration>({
        items: () => getItems(typeaheadMenuId.value),
        activeIndex: () =>
            getItems(typeaheadMenuId.value).findIndex(
                (item) => item.id === getActiveIdValue(typeaheadMenuId.value),
            ),
        getKey: (item) => item.id,
        getTextValue: (item) => item.textValue(),
        isDisabled: (item) => item.disabled(),
        scopeKey: () => typeaheadMenuId.value,
        onMatch(item) {
            setActive(item.id);
            closeSubmenus(item.menuId);
        },
    });

    function move(menuId: string, direction: 1 | -1) {
        const enabledItems = getEnabledItems(menuId);
        if (enabledItems.length === 0) {
            clearMenuState(menuId);
            return;
        }
        const currentIndex = enabledItems.findIndex((item) => item.id === getActiveIdValue(menuId));
        const start = currentIndex < 0 ? (direction === 1 ? -1 : 0) : currentIndex;
        const nextIndex = (start + direction + enabledItems.length) % enabledItems.length;
        const item = enabledItems[nextIndex];
        if (item) {
            setActive(item.id);
            closeSubmenus(menuId);
        }
    }

    function handleHorizontalKey(
        menuId: string,
        event: KeyboardEvent,
        activeItem: DropdownMenuInteractionItemRegistration | undefined,
    ) {
        const menu = menus.get(menuId);
        const isRight = event.key === 'ArrowRight';
        if (menuId !== host.rootMenuId && menu) {
            const closesWithRight = getPlacementSide(menu.placement()) === 'left';
            if (isRight === closesWithRight) {
                event.preventDefault();
                if (menu.stopKeyPropagation) event.stopPropagation();
                closeMenu(menuId, true);
                return;
            }
        }

        const submenuId = activeItem?.submenuId?.();
        if (!activeItem || activeItem.disabled() || !submenuId) return;
        const submenu = menus.get(submenuId);
        const opensRight =
            activeItem.submenuDirection?.() !== 'left' &&
            (!submenu || getPlacementSide(submenu.placement()) !== 'left');
        if (isRight !== opensRight) return;

        event.preventDefault();
        if (menu?.stopKeyPropagation) event.stopPropagation();
        openMenu(submenuId, 'first');
    }

    function onMenuKeydown(menuId: string, event: KeyboardEvent) {
        const menu = menus.get(menuId);
        typeaheadMenuId.value = menuId;
        if (typeahead.handleKey(event)) {
            if (menu?.stopKeyPropagation) event.stopPropagation();
            return;
        }

        const activeId = getActiveIdValue(menuId);
        const activeItem = activeId ? items.get(activeId) : undefined;
        const stop = () => {
            if (menu?.stopKeyPropagation) event.stopPropagation();
        };

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                stop();
                move(menuId, 1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                stop();
                move(menuId, -1);
                break;
            case 'Home':
                event.preventDefault();
                stop();
                focusMenu(menuId, 'first');
                closeSubmenus(menuId);
                break;
            case 'End':
                event.preventDefault();
                stop();
                focusMenu(menuId, 'last');
                closeSubmenus(menuId);
                break;
            case 'ArrowRight':
            case 'ArrowLeft':
                handleHorizontalKey(menuId, event, activeItem);
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                stop();
                if (activeItem) activateItem(activeItem.id, event);
                break;
            case 'Escape':
                event.preventDefault();
                stop();
                if (menu?.onEscape && !menu.onEscape(event)) return;
                if (!closeMenu(menuId, true)) close({ focusTrigger: true });
                break;
            case 'Tab':
                close();
                break;
        }
    }

    function open(options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget) {
        if (host.disabled.value) return;
        host.beforeOpen?.();
        pendingRootFocus.value = resolveOpenFocusTarget(options);
        host.setOpen(true);
        focusMenu(host.rootMenuId, pendingRootFocus.value);
    }

    function close(options: DropdownMenuCloseOptions & { returnFocus?: boolean } = {}) {
        host.beforeClose?.();
        host.setOpen(false);
        pendingRootFocus.value = false;
        closeAllSubmenus();
        clearMenuState(host.rootMenuId);
        activeItemId.value = null;
        activeMenuId.value = host.rootMenuId;
        typeahead.reset();
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

    function onTriggerKeydown(event: KeyboardEvent, beforeOpen?: () => void) {
        if (host.disabled.value) return;
        switch (event.key) {
            case 'Enter':
            case ' ':
            case 'ArrowDown':
                event.preventDefault();
                beforeOpen?.();
                open('first');
                break;
            case 'ArrowUp':
                event.preventDefault();
                beforeOpen?.();
                open('last');
                break;
            case 'Escape':
                close({ focusTrigger: true });
                break;
        }
    }

    function registerInside(element: Element) {
        inside.add(element);
    }

    function unregisterInside(element: Element) {
        inside.delete(element);
    }

    function isInside(event: Event) {
        return [...inside].some((element) => isEventWithinElement(event, element));
    }

    function emitOutside(type: 'pointer' | 'focus', originalEvent: Event) {
        const outsideEvent = createOutsideEvent(originalEvent);
        if (type === 'pointer') dismissal?.pointerDownOutside?.(outsideEvent);
        else dismissal?.focusOutside?.(outsideEvent);
        dismissal?.interactOutside?.(outsideEvent);
        return outsideEvent;
    }

    function blockModalInteraction(event: Event) {
        if (!host.modal.value) return;
        if (event.cancelable) event.preventDefault();
        event.stopPropagation();
        if (event.type === 'pointerdown') blockNextDocumentClick();
    }

    function shouldIgnoreOutside(event: Event) {
        const ignoredTargets = (dismissal?.ignoredTargets() ?? []).map((target) =>
            isRef(target) ? target.value : target,
        );
        return isInside(event) || isEventWithinTargets(event, ignoredTargets);
    }

    function onDocumentPointer(event: Event) {
        if (!host.isTopLayer() || shouldIgnoreOutside(event)) return;
        const outsideEvent = emitOutside('pointer', event);
        blockModalInteraction(event);
        if (!outsideEvent.defaultPrevented) close({ focusTrigger: host.modal.value });
    }

    function onDocumentFocus(event: Event) {
        if (!host.isTopLayer() || shouldIgnoreOutside(event)) return;
        const outsideEvent = emitOutside('focus', event);
        blockModalInteraction(event);
        if (!outsideEvent.defaultPrevented) close({ focusTrigger: host.modal.value });
        else if (host.modal.value) focusMenuElement(activeMenuId.value);
    }

    function setDocumentListeners(active: boolean) {
        if (typeof document === 'undefined' || active === isListening) return;
        isListening = active;
        const method = active ? 'addEventListener' : 'removeEventListener';
        document[method]('pointerdown', onDocumentPointer, true);
        document[method]('focusin', onDocumentFocus, true);
    }

    function registerDismissal(registration: DropdownMenuInteractionDismissalRegistration) {
        dismissal = registration;
        setDocumentListeners(host.isOpen.value);
        return () => {
            if (dismissal !== registration) return;
            dismissal = undefined;
            setDocumentListeners(false);
        };
    }

    watch(host.disabled, (disabled) => {
        if (disabled) close();
    });
    watch(
        host.isOpen,
        (openState) => {
            setDocumentListeners(openState && Boolean(dismissal));
            if (!openState) {
                closeAllSubmenus();
                clearMenuState(host.rootMenuId);
                activeItemId.value = null;
                activeMenuId.value = host.rootMenuId;
                typeahead.reset();
                return;
            }

            const focus = pendingRootFocus.value || 'first';
            focusMenu(host.rootMenuId, focus);
        },
        { immediate: true },
    );
    onBeforeUnmount(() => setDocumentListeners(false));

    return {
        rootMenuId: host.rootMenuId,
        activeItemId,
        activeMenuId,
        pendingRootFocus,
        registerMenu,
        unregisterMenu,
        registerMenuState,
        registerItem,
        unregisterItem,
        registerInside,
        unregisterInside,
        registerDismissal,
        getActiveId,
        getItem,
        getMenu,
        isActive,
        isMenuOpen,
        setActive,
        focusMenu,
        focusMenuElement,
        open,
        close,
        toggle,
        openMenu,
        closeMenu,
        closeSubmenus,
        selectItem,
        activateItem,
        hoverItem,
        reconcile,
        onTriggerClick,
        onTriggerKeydown,
        onMenuKeydown,
    };
}
