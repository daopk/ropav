import { ref, type Ref } from 'vue';
import { getParentPath, isPathPrefix } from '@/utils/indexPath';
import {
    DEFAULT_FOCUS_TARGET,
    hasItemSubmenu,
    type ItemPath,
    type SubmenuFocusTarget,
} from './dropdown-menu-model';
import type { DropdownMenuItem } from './types';

type UseDropdownSubmenusOptions = {
    focusedPath: Ref<ItemPath>;
    getItemAtPath: (path: ItemPath) => DropdownMenuItem | undefined;
    focusItem: (target: Exclude<SubmenuFocusTarget, false>, menuPath?: ItemPath) => boolean;
};

export function useDropdownSubmenus({
    focusedPath,
    getItemAtPath,
    focusItem,
}: UseDropdownSubmenusOptions) {
    const openSubmenuPath = ref<ItemPath>([]);

    function resetSubmenus() {
        openSubmenuPath.value = [];
    }

    function isSubmenuOpen(path: ItemPath) {
        return path.length > 0 && isPathPrefix(path, openSubmenuPath.value);
    }

    function closeSubmenusAfter(menuPath: ItemPath) {
        openSubmenuPath.value = [...menuPath];
    }

    function openSubmenu(path: ItemPath, focus: SubmenuFocusTarget = DEFAULT_FOCUS_TARGET) {
        const item = getItemAtPath(path);
        if (!item || item.disabled || !hasItemSubmenu(item)) return false;

        openSubmenuPath.value = [...path];
        if (focus && !focusItem(focus, path)) focusedPath.value = [...path];
        return true;
    }

    function closeSubmenu(path: ItemPath) {
        if (!isSubmenuOpen(path)) return false;

        openSubmenuPath.value = getParentPath(path);
        if (isPathPrefix(path, focusedPath.value) && focusedPath.value.length > path.length) {
            focusedPath.value = [...path];
        }
        return true;
    }

    function closeCurrentSubmenu() {
        const path =
            focusedPath.value.length > 1 ? getParentPath(focusedPath.value) : focusedPath.value;

        if (path.length === 0 || !isSubmenuOpen(path)) return false;

        return closeSubmenu(path);
    }

    return {
        openSubmenuPath,
        resetSubmenus,
        isSubmenuOpen,
        closeSubmenusAfter,
        openSubmenu,
        closeSubmenu,
        closeCurrentSubmenu,
    };
}
