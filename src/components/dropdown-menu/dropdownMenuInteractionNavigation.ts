import type { DropdownMenuCloseOptions, DropdownMenuFocusTarget } from './types';
import type { DropdownMenuInteractionRegistry } from './dropdownMenuInteractionRegistry';
import type {
    DropdownMenuInteractionFocusTarget,
    DropdownMenuInteractionHost,
} from './dropdownMenuInteractionTypes';

interface CreateDropdownMenuInteractionNavigationOptions {
    host: DropdownMenuInteractionHost;
    registry: DropdownMenuInteractionRegistry;
    closeRoot: (options?: DropdownMenuCloseOptions & { returnFocus?: boolean }) => void;
}

export function createDropdownMenuInteractionNavigation({
    host,
    registry,
    closeRoot,
}: CreateDropdownMenuInteractionNavigationOptions) {
    const state = registry.state;

    function closeMenu(menuId: string, focusParent = false) {
        const menu = registry.getMenu(menuId);
        const menuState = state.getMenuState(menuId);
        if ((!menu && !menuState) || menuId === host.rootMenuId) return false;
        const wasOpen = registry.isMenuOpen(menuId);

        closeSubmenus(menuId);
        const shouldRestoreParent = focusParent || registry.activeMenuId.value === menuId;
        if (wasOpen) state.setMenuOpen(menuId, false);
        state.clearPendingMenuFocus(menuId);
        state.clearMenuState(menuId);

        if (shouldRestoreParent) {
            const parentItem = state.getParentItem(menuId);
            if (!parentItem || !registry.setActive(parentItem.id, focusParent)) {
                const parentMenuId = parentItem?.menuId ?? host.rootMenuId;
                registry.activeMenuId.value = parentMenuId;
                registry.activeItemId.value = state.getActiveIdValue(parentMenuId);
                if (focusParent) registry.focusMenuElement(parentMenuId);
            }
        }

        return wasOpen;
    }

    function closeSubmenus(menuId: string, exceptMenuId?: string) {
        for (const item of state.getItems(menuId)) {
            const submenuId = item.submenuId?.();
            if (!submenuId || submenuId === exceptMenuId) continue;
            closeMenu(submenuId, false);
        }
    }

    function closeAllSubmenus() {
        closeSubmenus(host.rootMenuId);
        for (const menuId of state.getMenuIds()) {
            if (menuId !== host.rootMenuId && registry.isMenuOpen(menuId)) {
                closeMenu(menuId, false);
            }
        }
    }

    function focusMenu(menuId: string, target: DropdownMenuFocusTarget = 'first') {
        const enabledItems = state.getEnabledItems(menuId);
        const item = target === 'last' ? enabledItems.at(-1) : enabledItems[0];
        registry.focusMenuElement(menuId);
        if (!item) {
            state.clearMenuState(menuId);
            registry.activeMenuId.value = menuId;
            const parentItem = state.getParentItem(menuId);
            if (parentItem) registry.activeItemId.value = parentItem.id;
            return false;
        }

        return registry.setActive(item.id);
    }

    function openMenu(menuId: string, focus: DropdownMenuInteractionFocusTarget = 'first') {
        const menu = registry.getMenu(menuId);
        const menuState = state.getMenuState(menuId);
        if ((!menu && !menuState) || menuId === host.rootMenuId) return false;
        const parentItem = state.getParentItem(menuId);
        if (!parentItem || parentItem.disabled()) return false;

        closeSubmenus(parentItem.menuId, menuId);
        state.setPendingMenuFocus(menuId, focus);
        state.setMenuOpen(menuId, true);
        if (focus && menu) focusMenu(menuId, focus);
        return true;
    }

    function selectItem(id: string, originalEvent: Event = new Event('select')) {
        const item = registry.getItem(id);
        if (!item || item.disabled()) return;

        const selectEvent = item.select?.(originalEvent);
        if (selectEvent && !selectEvent.defaultPrevented && (item.closeOnSelect?.() ?? true)) {
            closeRoot({ focusTrigger: true });
        }
    }

    function activateItem(id: string, originalEvent: Event = new Event('select')) {
        const item = registry.getItem(id);
        if (!item || item.disabled()) return;
        const submenuId = item.submenuId?.();
        if (submenuId) {
            openMenu(submenuId, 'first');
            return;
        }

        selectItem(id, originalEvent);
    }

    function hoverItem(id: string, openSubmenu = false) {
        const item = registry.getItem(id);
        if (!item || item.disabled()) return;
        registry.setActive(id);
        const submenuId = item.submenuId?.();
        if (openSubmenu && submenuId) openMenu(submenuId, false);
        else {
            closeSubmenus(
                item.menuId,
                submenuId && registry.isMenuOpen(submenuId) ? submenuId : undefined,
            );
        }
    }

    function reconcileOpenSubmenus() {
        for (const menuId of state.getMenuIds()) {
            if (menuId === host.rootMenuId || !registry.isMenuOpen(menuId)) continue;
            const parentItem = state.getParentItem(menuId);
            if (!parentItem || parentItem.disabled()) closeMenu(menuId, false);
        }
    }

    function reconcile(menuId?: string) {
        const menuIds = menuId ? [menuId] : state.getRegisteredMenuIds();
        for (const id of menuIds) {
            const activeId = state.getActiveIdValue(id);
            if (!activeId) continue;
            const currentItems = state.getItems(id);
            const activeIndex = currentItems.findIndex((item) => item.id === activeId);
            const activeItem = currentItems[activeIndex];
            if (activeItem && !activeItem.disabled()) continue;
            state.chooseNeighbor(id, Math.max(0, activeIndex));
        }
        reconcileOpenSubmenus();
    }

    return {
        closeMenu,
        closeSubmenus,
        closeAllSubmenus,
        focusMenu,
        openMenu,
        selectItem,
        activateItem,
        hoverItem,
        reconcile,
        reconcileOpenSubmenus,
    };
}

export type DropdownMenuInteractionNavigation = ReturnType<
    typeof createDropdownMenuInteractionNavigation
>;
