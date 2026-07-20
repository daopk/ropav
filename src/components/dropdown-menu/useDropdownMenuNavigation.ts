import { computed, ref } from 'vue';
import { getEnabledIndexes, getNextEnabledIndex } from '@/composables/collectionNavigation';
import type { DropdownMenuFocusTarget, DropdownMenuItem } from './types';
import { arePathsEqual, getParentPath, normalizePath, type ItemPath } from './dropdown-menu-utils';

type DropdownMenuItemsSource = {
    readonly value: DropdownMenuItem[];
};

export function useDropdownMenuNavigation(items: DropdownMenuItemsSource) {
    const focusedPath = ref<ItemPath>([]);
    const focusedIndex = computed(() => focusedPath.value[0] ?? -1);

    function getItemsAtPath(path: ItemPath) {
        let currentItems = items.value;
        for (const index of path) {
            const item = currentItems[index];
            if (!item) return [];
            currentItems = item.children ?? [];
        }
        return currentItems;
    }

    function getItemAtPath(path: ItemPath) {
        if (path.length === 0) return undefined;
        const parentItems = getItemsAtPath(getParentPath(path));
        return parentItems[path[path.length - 1]];
    }

    function focusItem(target: DropdownMenuFocusTarget, menuPath: ItemPath = []) {
        const enabledIndexes = getEnabledIndexes(getItemsAtPath(menuPath), (item) =>
            Boolean(item.disabled),
        );
        const index =
            target === 'last' ? enabledIndexes[enabledIndexes.length - 1] : enabledIndexes[0];

        if (index === undefined) {
            if (menuPath.length === 0) focusedPath.value = [];
            return false;
        }

        focusedPath.value = [...menuPath, index];
        return true;
    }

    function resetFocus() {
        focusedPath.value = [];
    }

    function setFocusedIndex(index: number, menuPath: ItemPath = []) {
        const item = getItemsAtPath(menuPath)[index];
        if (!item || item.disabled) return false;
        focusedPath.value = [...menuPath, index];
        return true;
    }

    function isItemFocused(indexOrPath: number | ItemPath) {
        return arePathsEqual(normalizePath(indexOrPath), focusedPath.value);
    }

    function moveFocus(direction: 1 | -1) {
        const menuPath = getParentPath(focusedPath.value);
        const itemsAtPath = getItemsAtPath(menuPath);
        const currentIndex =
            focusedPath.value.length === 0
                ? direction === 1
                    ? -1
                    : itemsAtPath.length
                : focusedPath.value[focusedPath.value.length - 1]!;
        const nextIndex = getNextEnabledIndex(itemsAtPath, currentIndex, direction, (item) =>
            Boolean(item.disabled),
        );

        if (nextIndex === undefined) {
            focusedPath.value = [];
            return undefined;
        }

        focusedPath.value = [...menuPath, nextIndex];
        return menuPath;
    }

    return {
        focusedPath,
        focusedIndex,
        getItemsAtPath,
        getItemAtPath,
        focusItem,
        resetFocus,
        setFocusedIndex,
        isItemFocused,
        moveFocus,
    };
}
