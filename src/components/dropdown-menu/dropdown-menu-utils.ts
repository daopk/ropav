import { bem } from '@/utils/bem';
import type {
    DropdownMenuFocusTarget,
    DropdownMenuItem,
    DropdownMenuItemPath,
    DropdownMenuOpenOptions,
    DropdownMenuPlacement,
} from './types';

export const DEFAULT_PLACEMENT: DropdownMenuPlacement = 'bottom-start';
export const DEFAULT_FOCUS_TARGET: DropdownMenuFocusTarget = 'first';

export type ItemPath = DropdownMenuItemPath;
export type SubmenuFocusTarget = DropdownMenuFocusTarget | false;

export type PointerPoint = {
    x: number;
    y: number;
};

export function getOpenFocusTarget(
    options: DropdownMenuOpenOptions | DropdownMenuFocusTarget | undefined,
) {
    if (typeof options === 'string') return options;
    return options?.focus ?? DEFAULT_FOCUS_TARGET;
}

export function getItemClass(
    item: DropdownMenuItem,
    focused: boolean,
    disabled: boolean,
    hasSubmenu: boolean,
    submenuOpen: boolean,
) {
    return bem('rp-dropdown-menu__item', {
        focused,
        disabled,
        destructive: item.destructive,
        submenu: hasSubmenu,
        open: submenuOpen,
    });
}

export function hasItemSubmenu(item: DropdownMenuItem) {
    return (item.children?.length ?? 0) > 0;
}

export function hasNestedItems(items: DropdownMenuItem[]): boolean {
    return items.some(hasItemSubmenu);
}

export function getPathKey(path: ItemPath) {
    return path.length === 0 ? 'root' : path.join('-');
}

export function getParentPath(path: ItemPath) {
    return path.slice(0, -1);
}

export function arePathsEqual(a: ItemPath, b: ItemPath) {
    return a.length === b.length && a.every((part, index) => part === b[index]);
}

export function isPathPrefix(prefix: ItemPath, path: ItemPath) {
    return prefix.length <= path.length && prefix.every((part, index) => part === path[index]);
}

export function normalizePath(indexOrPath: number | ItemPath): ItemPath {
    return Array.isArray(indexOrPath) ? indexOrPath : [indexOrPath];
}

export function getEventPoint(event: MouseEvent): PointerPoint {
    return {
        x: event.clientX,
        y: event.clientY,
    };
}

export function hasMeasuredRect(rect: DOMRect) {
    return rect.width > 0 || rect.height > 0;
}

export function isPointInRect(point: PointerPoint, rect: DOMRect, padding = 0) {
    return (
        point.x >= rect.left - padding &&
        point.x <= rect.right + padding &&
        point.y >= rect.top - padding &&
        point.y <= rect.bottom + padding
    );
}

export function getEnabledIndexes(items: DropdownMenuItem[]) {
    return items.map((item, index) => (item.disabled ? -1 : index)).filter((index) => index >= 0);
}

export function getNextEnabledIndex(items: DropdownMenuItem[], index: number, direction: 1 | -1) {
    const enabledIndexes = getEnabledIndexes(items);
    if (enabledIndexes.length === 0) return undefined;

    if (direction === 1) {
        return enabledIndexes.find((candidate) => candidate > index) ?? enabledIndexes[0];
    }

    for (let i = enabledIndexes.length - 1; i >= 0; i -= 1) {
        const candidate = enabledIndexes[i]!;
        if (candidate < index) return candidate;
    }

    return enabledIndexes[enabledIndexes.length - 1];
}
