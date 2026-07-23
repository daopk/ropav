import { computed, nextTick, ref } from 'vue';
import type { DropdownMenuFocusTarget } from './types';
import type {
    DropdownMenuInteractionFocusTarget,
    DropdownMenuInteractionHost,
    DropdownMenuInteractionItemRegistration,
    DropdownMenuInteractionMenuRegistration,
    DropdownMenuInteractionMenuStateRegistration,
} from './dropdownMenuInteractionTypes';

export interface DropdownMenuInteractionRegistryNavigation {
    closeMenu: (menuId: string, focusParent?: boolean) => boolean;
    closeSubmenus: (menuId: string, exceptMenuId?: string) => void;
    focusMenu: (menuId: string, target?: DropdownMenuFocusTarget) => boolean;
    reconcile: (menuId?: string) => void;
    reconcileOpenSubmenus: () => void;
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

export function createDropdownMenuInteractionRegistry(
    host: DropdownMenuInteractionHost,
    navigation: DropdownMenuInteractionRegistryNavigation,
) {
    const menus = new Map<string, DropdownMenuInteractionMenuRegistration>();
    const menuStates = new Map<string, DropdownMenuInteractionMenuStateRegistration>();
    const items = new Map<string, DropdownMenuInteractionItemRegistration>();
    const activeIds = ref(new Map<string, string>());
    const activeItemId = ref<string | null>(null);
    const activeMenuId = ref(host.rootMenuId);
    const pendingRootFocus = ref<DropdownMenuInteractionFocusTarget>('first');
    const pendingMenuFocus = new Map<string, DropdownMenuInteractionFocusTarget>();

    function getMenu(id: string) {
        return menus.get(id);
    }

    function getMenuState(id: string) {
        return menuStates.get(id);
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

    function isMenuOpen(menuId: string) {
        if (menuId === host.rootMenuId) return host.isOpen.value;
        return menuStates.get(menuId)?.isOpen() ?? menus.get(menuId)?.isOpen() ?? false;
    }

    function focusMenuElement(menuId: string) {
        void nextTick(() => {
            const menu = menus.get(menuId);
            (menu?.focusTarget?.() ?? menu?.element())?.focus();
        });
    }

    function clearMenuState(menuId: string) {
        const activeId = getActiveIdValue(menuId);
        if (activeId && activeItemId.value === activeId) activeItemId.value = null;
        setActiveId(menuId, null);
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

    function getParentItem(menuId: string) {
        const parentItemId = menus.get(menuId)?.parentItemId?.();
        if (parentItemId) {
            const parentItem = items.get(parentItemId);
            if (parentItem) return parentItem;
        }

        return [...items.values()].find((item) => item.submenuId?.() === menuId);
    }

    function setMenuOpen(menuId: string, open: boolean) {
        const state = menuStates.get(menuId);
        if (state) state.setOpen(open);
        else menus.get(menuId)?.setOpen?.(open);
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

    function unregisterItem(id: string) {
        const item = items.get(id);
        if (!item) return;
        const previousItems = getItems(item.menuId);
        const previousIndex = previousItems.findIndex((current) => current.id === id);
        const submenuId = item.submenuId?.();
        if (submenuId) navigation.closeMenu(submenuId, false);
        items.delete(id);
        if (getActiveIdValue(item.menuId) === id) chooseNeighbor(item.menuId, previousIndex);
        navigation.reconcileOpenSubmenus();
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
            isMenuOpen(registration.menuId) &&
            !getActiveIdValue(registration.menuId) &&
            !registration.disabled()
        ) {
            const enabledItems = getEnabledItems(registration.menuId);
            const pending = pendingMenuFocus.get(registration.menuId);
            const candidate = pending === 'last' ? enabledItems.at(-1) : enabledItems[0];
            if (candidate) setActive(candidate.id);
        } else {
            navigation.reconcile(registration.menuId);
        }

        return () => {
            if (items.get(registration.id) === registration) unregisterItem(registration.id);
        };
    }

    function unregisterMenu(id: string) {
        const menu = menus.get(id);
        if (!menu) return;
        navigation.closeSubmenus(id);
        if (id !== host.rootMenuId) navigation.closeMenu(id, false);
        clearMenuState(id);
        menus.delete(id);
    }

    function registerMenu(registration: DropdownMenuInteractionMenuRegistration) {
        menus.set(registration.id, registration);
        const pending = pendingMenuFocus.get(registration.id);
        if (registration.isOpen() && pending) {
            void nextTick(() => navigation.focusMenu(registration.id, pending));
        }

        return () => {
            if (menus.get(registration.id) === registration) unregisterMenu(registration.id);
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

    const state = {
        getMenuState,
        getItems,
        getEnabledItems,
        getActiveIdValue,
        clearMenuState,
        getParentItem,
        setMenuOpen,
        chooseNeighbor,
        getMenuIds: () => new Set([...menus.keys(), ...menuStates.keys()]),
        getRegisteredMenuIds: () => [...menus.keys()],
        getPendingMenuFocus: (menuId: string) => pendingMenuFocus.get(menuId),
        setPendingMenuFocus: (menuId: string, focus: DropdownMenuInteractionFocusTarget) =>
            pendingMenuFocus.set(menuId, focus),
        clearPendingMenuFocus: (menuId: string) => pendingMenuFocus.delete(menuId),
    };

    return {
        activeItemId,
        activeMenuId,
        pendingRootFocus,
        registerMenu,
        unregisterMenu,
        registerMenuState,
        registerItem,
        unregisterItem,
        getActiveId,
        getItem,
        getMenu,
        isActive,
        isMenuOpen,
        setActive,
        focusMenuElement,
        state,
    };
}

export type DropdownMenuInteractionRegistry = ReturnType<
    typeof createDropdownMenuInteractionRegistry
>;
