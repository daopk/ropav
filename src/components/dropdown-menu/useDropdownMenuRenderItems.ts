import { computed } from 'vue';
import { bem } from '@/utils/bem';
import type {
    DropdownMenuCloseOptions,
    DropdownMenuFocusTarget,
    DropdownMenuItem,
    DropdownMenuItemProps,
    DropdownMenuItemSlotProps,
    DropdownMenuRenderedItem,
    DropdownMenuSubmenuProps,
} from './types';
import {
    DEFAULT_FOCUS_TARGET,
    getItemClass,
    getPathKey,
    hasItemSubmenu,
    hasNestedItems,
    normalizePath,
    type ItemPath,
} from './dropdown-menu-utils';

type DropdownMenuItemsSource = {
    readonly value: DropdownMenuItem[];
};

type UseDropdownMenuRenderItemsOptions = {
    items: DropdownMenuItemsSource;
    getItemId: (path: ItemPath) => string;
    getSubmenuId: (path: ItemPath) => string;
    getMenuActiveDescendant: (path: ItemPath) => string | undefined;
    isItemFocused: (indexOrPath: number | ItemPath) => boolean;
    isSubmenuOpen: (path: ItemPath) => boolean;
    activateItem: (item: DropdownMenuItem, path: ItemPath, event?: MouseEvent) => void;
    focusHoveredItem: (
        item: DropdownMenuItem,
        indexOrPath: number | ItemPath,
        event?: MouseEvent,
    ) => void;
    selectItem: (item: DropdownMenuItem) => void;
    openSubmenu: (path: ItemPath, focus?: DropdownMenuFocusTarget) => void;
    closeSubmenu: (path: ItemPath) => void;
    close: (options?: DropdownMenuCloseOptions) => void;
};

export function useDropdownMenuRenderItems({
    items,
    getItemId,
    getSubmenuId,
    getMenuActiveDescendant,
    isItemFocused,
    isSubmenuOpen,
    activateItem,
    focusHoveredItem,
    selectItem,
    openSubmenu,
    closeSubmenu,
    close,
}: UseDropdownMenuRenderItemsOptions) {
    const renderedItems = computed<DropdownMenuRenderedItem[]>(() => getRenderedItems(items.value));

    function getRenderedItems(
        dropdownItems: DropdownMenuItem[],
        parentPath: ItemPath = [],
    ): DropdownMenuRenderedItem[] {
        return dropdownItems.map((item, index) => {
            const path = [...parentPath, index];
            const level = parentPath.length;
            const focused = isItemFocused(path);
            const disabled = Boolean(item.disabled);
            const hasSubmenu = hasItemSubmenu(item);
            const submenuOpen = hasSubmenu && isSubmenuOpen(path);

            return {
                item,
                index,
                key: `${getPathKey(path)}:${String(item.value)}`,
                path,
                level,
                focused,
                disabled,
                hasSubmenu,
                submenuOpen,
                props: getItemProps(item, path, focused, disabled),
                submenuProps: hasSubmenu ? getSubmenuProps(item, path) : undefined,
                slotProps: getItemSlotProps(item, path, focused, disabled),
                children: hasSubmenu ? getRenderedItems(item.children ?? [], path) : [],
            };
        });
    }

    function getItemProps(
        item: DropdownMenuItem,
        indexOrPath: number | ItemPath,
        focused = isItemFocused(indexOrPath),
        disabled = Boolean(item.disabled),
    ): DropdownMenuItemProps {
        const path = normalizePath(indexOrPath);
        const hasSubmenu = hasItemSubmenu(item);
        const submenuOpen = hasSubmenu && isSubmenuOpen(path);

        return {
            id: getItemId(path),
            type: 'button',
            role: 'menuitem',
            tabindex: -1,
            class: getItemClass(item, focused, disabled, hasSubmenu, submenuOpen),
            'aria-controls': hasSubmenu ? getSubmenuId(path) : undefined,
            'aria-expanded': hasSubmenu ? submenuOpen : undefined,
            'aria-haspopup': hasSubmenu ? 'menu' : undefined,
            'aria-disabled': disabled || undefined,
            'data-disabled': disabled || undefined,
            'data-focused': focused || undefined,
            'data-submenu': hasSubmenu || undefined,
            onClick: (event) => activateItem(item, path, event),
            onMouseenter: (event) => focusHoveredItem(item, path, event),
        };
    }

    function getSubmenuProps(item: DropdownMenuItem, path: ItemPath): DropdownMenuSubmenuProps {
        return {
            id: getSubmenuId(path),
            role: 'menu',
            class: bem('rp-dropdown-menu__submenu', {
                open: isSubmenuOpen(path),
                'has-submenu': hasNestedItems(item.children ?? []),
            }),
            'aria-label': item.label,
            'aria-activedescendant': getMenuActiveDescendant(path),
        };
    }

    function getItemSlotProps(
        item: DropdownMenuItem,
        indexOrPath: number | ItemPath,
        focused = isItemFocused(indexOrPath),
        disabled = Boolean(item.disabled),
    ): DropdownMenuItemSlotProps {
        const path = normalizePath(indexOrPath);
        const hasSubmenu = hasItemSubmenu(item);

        return {
            item,
            index: path[path.length - 1] ?? -1,
            path,
            level: path.length - 1,
            focused,
            disabled,
            hasSubmenu,
            isSubmenuOpen: hasSubmenu && isSubmenuOpen(path),
            select: () => selectItem(item),
            openSubmenu: (focus = DEFAULT_FOCUS_TARGET) => openSubmenu(path, focus),
            closeSubmenu: () => closeSubmenu(path),
            close,
        };
    }

    return {
        renderedItems,
        getItemProps,
        getItemSlotProps,
    };
}
