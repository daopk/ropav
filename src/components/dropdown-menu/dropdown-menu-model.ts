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
