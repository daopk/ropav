import { computed, type Ref } from 'vue';
import { hasMeasuredRect, type Point } from '@/utils/geometry';
import { getPathKey, normalizePath } from '@/utils/indexPath';
import {
    DEFAULT_FOCUS_TARGET,
    hasItemSubmenu,
    type ItemPath,
    type SubmenuFocusTarget,
} from './dropdown-menu-model';
import type { DropdownMenuInteractionRuntime } from './dropdownMenuInteraction';
import type {
    DropdownMenuItem,
    DropdownMenuPlacement,
    DropdownMenuProps,
    DropdownMenuSelectEvent,
} from './types';
import { useDropdownMenuDataRegistration } from './useDropdownMenuDataRegistration';
import { useDropdownMenuHoverIntent } from './useDropdownMenuHoverIntent';

interface UseDropdownMenuDataControllerOptions {
    props: Readonly<DropdownMenuProps>;
    items: Readonly<Ref<DropdownMenuItem[]>>;
    rootMenuId: string;
    menuId: Readonly<Ref<string>>;
    menuRef: Readonly<Ref<HTMLElement | null>>;
    actualPlacement: Readonly<Ref<DropdownMenuPlacement>>;
    interaction: DropdownMenuInteractionRuntime;
    onSelect?: (item: DropdownMenuItem, event: DropdownMenuSelectEvent) => void;
}

export function useDropdownMenuDataController({
    props,
    items,
    rootMenuId,
    menuId,
    menuRef,
    actualPlacement,
    interaction,
    onSelect,
}: UseDropdownMenuDataControllerOptions) {
    function getItemId(path: ItemPath) {
        return `${menuId.value}-item-${getPathKey(path)}`;
    }

    function getSubmenuId(path: ItemPath) {
        return `${menuId.value}-submenu-${getPathKey(path)}`;
    }

    function getItemElement(path: ItemPath) {
        return typeof document === 'undefined' ? null : document.getElementById(getItemId(path));
    }

    function getSubmenuElement(path: ItemPath) {
        return typeof document === 'undefined' ? null : document.getElementById(getSubmenuId(path));
    }

    function isSubmenuOpeningLeft(path: ItemPath) {
        const submenuRect = getSubmenuElement(path)?.getBoundingClientRect();
        const itemRect = getItemElement(path)?.getBoundingClientRect();
        if (submenuRect && itemRect && hasMeasuredRect(submenuRect) && hasMeasuredRect(itemRect)) {
            return submenuRect.right <= itemRect.left;
        }
        return actualPlacement.value.endsWith('end');
    }

    const { openMenuIds, registrationIndex } = useDropdownMenuDataRegistration({
        props,
        items,
        rootMenuId,
        interaction,
        menuRef,
        getItemElement,
        getSubmenuElement,
        isSubmenuOpeningLeft,
        onSelect,
    });

    function getDataItemId(path: ItemPath) {
        return registrationIndex.value.itemIdByPath.get(getPathKey(path));
    }

    const focusedPath: Ref<ItemPath> = computed<ItemPath>({
        get() {
            const id = interaction.activeItemId.value;
            return id ? [...(registrationIndex.value.pathByItemId.get(id) ?? [])] : [];
        },
        set(path) {
            interaction.setActive(path.length > 0 ? (getDataItemId(path) ?? null) : null);
        },
    });
    const focusedIndex = computed(() => focusedPath.value[0] ?? -1);
    const activeDescendantId = computed(() =>
        focusedPath.value.length === 0 ? undefined : getItemId(focusedPath.value),
    );
    const openSubmenuPath = computed<ItemPath>(() => {
        let deepest: ItemPath = [];
        for (const id of openMenuIds.value) {
            const path = registrationIndex.value.pathByMenuId.get(id);
            if (path && path.length > deepest.length) deepest = path;
        }
        return [...deepest];
    });

    function isItemFocused(indexOrPath: number | ItemPath) {
        const id = getDataItemId(normalizePath(indexOrPath));
        return Boolean(id && interaction.activeItemId.value === id);
    }

    function isSubmenuOpen(path: ItemPath) {
        const itemId = getDataItemId(path);
        const submenuId = itemId ? interaction.getItem(itemId)?.submenuId?.() : undefined;
        return Boolean(submenuId && interaction.isMenuOpen(submenuId));
    }

    function openSubmenu(
        path: ItemPath,
        focus: SubmenuFocusTarget = DEFAULT_FOCUS_TARGET,
        point?: Point,
    ) {
        const itemId = getDataItemId(path);
        const submenuId = itemId ? interaction.getItem(itemId)?.submenuId?.() : undefined;
        if (!submenuId || !interaction.openMenu(submenuId, focus)) return false;

        hoverIntent.trackSubmenuOpen(path, point);
        return true;
    }

    function closeSubmenu(path: ItemPath) {
        const itemId = getDataItemId(path);
        const submenuId = itemId ? interaction.getItem(itemId)?.submenuId?.() : undefined;
        const closed = submenuId ? interaction.closeMenu(submenuId, false) : false;
        if (closed) hoverIntent.resetHoverIntent();
        return closed;
    }

    function commitHoveredItem(item: DropdownMenuItem, path: ItemPath, point?: Point) {
        const itemId = getDataItemId(path);
        const itemRegistration = itemId ? interaction.getItem(itemId) : undefined;
        if (!itemRegistration) return;

        hoverIntent.clearPendingHover();
        interaction.setActive(itemRegistration.id);
        if (hasItemSubmenu(item)) openSubmenu(path, false, point);
        else interaction.closeSubmenus(itemRegistration.menuId);
    }

    const hoverIntent = useDropdownMenuHoverIntent({
        openSubmenuPath,
        getItemElement,
        getSubmenuElement,
    });

    function focusHoveredItem(
        item: DropdownMenuItem,
        indexOrPath: number | ItemPath,
        event?: MouseEvent,
    ) {
        if (item.disabled) return;
        hoverIntent.handleItemHover(item, normalizePath(indexOrPath), event, commitHoveredItem);
    }

    function selectItem(item: DropdownMenuItem, originalEvent: Event = new Event('select')) {
        const id = registrationIndex.value.primaryItemId.get(item);
        if (id) interaction.selectItem(id, originalEvent);
    }

    function activateItem(
        _item: DropdownMenuItem,
        path: ItemPath,
        event?: MouseEvent | KeyboardEvent,
    ) {
        const id = getDataItemId(path);
        if (id) interaction.activateItem(id, event);
    }

    function getMenuActiveDescendant(path: ItemPath) {
        const pathKey = getPathKey(path);
        const activeId = interaction.getActiveId(
            registrationIndex.value.menuIdByPath.get(pathKey) ?? rootMenuId,
        ).value;
        const activePath = activeId
            ? registrationIndex.value.pathByItemId.get(activeId)
            : undefined;
        return activePath ? getItemId(activePath) : undefined;
    }

    return {
        focusedPath,
        focusedIndex,
        activeDescendantId,
        getItemId,
        getSubmenuId,
        getItemElement,
        getMenuActiveDescendant,
        isItemFocused,
        isSubmenuOpen,
        openSubmenu,
        closeSubmenu,
        focusHoveredItem,
        onMenuMousemove: (event: MouseEvent) =>
            hoverIntent.handleMenuMousemove(event, commitHoveredItem),
        resetHoverIntent: hoverIntent.resetHoverIntent,
        selectItem,
        activateItem,
    };
}
