import { computed, nextTick, watch, type Ref } from 'vue';
import type { DropdownMenuPlacement } from './types';
import {
    arePathsEqual,
    getParentPath,
    getPathKey,
    hasMeasuredRect,
    normalizePath,
    type ItemPath,
} from './dropdown-menu-utils';

type StringSource = {
    readonly value: string;
};
type PlacementSource = {
    readonly value: DropdownMenuPlacement;
};

type UseDropdownMenuDomOptions = {
    menuId: StringSource;
    rootRef: Ref<HTMLElement | null>;
    menuRef: Ref<HTMLElement | null>;
    placement: PlacementSource;
    focusedPath: Ref<ItemPath>;
};

export function useDropdownMenuDom({
    menuId,
    rootRef,
    menuRef,
    placement,
    focusedPath,
}: UseDropdownMenuDomOptions) {
    const activeDescendantId = computed(() =>
        focusedPath.value.length === 0 ? undefined : getItemId(focusedPath.value),
    );

    function focusMenu() {
        nextTick(() => menuRef.value?.focus());
    }

    function focusTrigger() {
        nextTick(() => {
            const trigger = rootRef.value?.querySelector<HTMLElement>('[aria-haspopup="menu"]');
            trigger?.focus();
        });
    }

    function getItemId(indexOrPath: number | ItemPath) {
        return `${menuId.value}-item-${getPathKey(normalizePath(indexOrPath))}`;
    }

    function getSubmenuId(path: ItemPath) {
        return `${menuId.value}-submenu-${getPathKey(path)}`;
    }

    function getItemElement(path: ItemPath) {
        return document.getElementById(getItemId(path));
    }

    function getSubmenuElement(path: ItemPath) {
        return document.getElementById(getSubmenuId(path));
    }

    function isSubmenuOpeningLeft(path: ItemPath) {
        const submenuRect = getSubmenuElement(path)?.getBoundingClientRect();
        const itemRect = getItemElement(path)?.getBoundingClientRect();

        if (submenuRect && itemRect && hasMeasuredRect(submenuRect) && hasMeasuredRect(itemRect)) {
            return submenuRect.right <= itemRect.left;
        }

        return placement.value.endsWith('end');
    }

    function getMenuActiveDescendant(menuPath: ItemPath) {
        return arePathsEqual(getParentPath(focusedPath.value), menuPath)
            ? getItemId(focusedPath.value)
            : undefined;
    }

    watch(focusedPath, (path) => {
        if (path.length === 0) return;

        const targetPath = [...path];
        nextTick(() => {
            if (!arePathsEqual(targetPath, focusedPath.value)) return;
            getItemElement(targetPath)?.scrollIntoView?.({ block: 'nearest' });
        });
    });

    return {
        activeDescendantId,
        focusMenu,
        focusTrigger,
        getItemId,
        getSubmenuId,
        getItemElement,
        getSubmenuElement,
        isSubmenuOpeningLeft,
        getMenuActiveDescendant,
    };
}
