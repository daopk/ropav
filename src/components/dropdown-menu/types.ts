export type DropdownMenuPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

export type DropdownMenuItemValue = string | number;

export type DropdownMenuFocusTarget = 'first' | 'last';

export type DropdownMenuItemPath = number[];

export interface DropdownMenuOpenOptions {
    focus?: DropdownMenuFocusTarget;
}

export interface DropdownMenuCloseOptions {
    focusTrigger?: boolean;
}

export interface DropdownMenuItem {
    label: string;
    value: DropdownMenuItemValue;
    disabled?: boolean;
    destructive?: boolean;
    shortcut?: string;
    children?: DropdownMenuItem[];
}

export interface DropdownMenuTriggerProps {
    'aria-controls'?: string;
    'aria-expanded'?: boolean;
    'aria-haspopup': 'menu';
    disabled?: boolean;
    onClick: (event: MouseEvent) => void;
    onKeydown: (event: KeyboardEvent) => void;
}

export interface DropdownMenuContentProps {
    id: string;
    role: 'menu';
    tabindex: -1;
    'aria-label'?: string;
    'aria-activedescendant'?: string;
    onKeydown: (event: KeyboardEvent) => void;
    onMousemove: (event: MouseEvent) => void;
    onMouseleave: (event: MouseEvent) => void;
}

export interface DropdownMenuSlotProps {
    triggerProps: DropdownMenuTriggerProps;
    isOpen: boolean;
    open: (options?: DropdownMenuOpenOptions | DropdownMenuFocusTarget) => void;
    close: (options?: DropdownMenuCloseOptions) => void;
    toggle: () => void;
}

export interface DropdownMenuItemSlotProps {
    item: DropdownMenuItem;
    index: number;
    path: DropdownMenuItemPath;
    level: number;
    focused: boolean;
    disabled: boolean;
    hasSubmenu: boolean;
    isSubmenuOpen: boolean;
    select: () => void;
    openSubmenu: (focus?: DropdownMenuFocusTarget) => void;
    closeSubmenu: () => void;
    close: (options?: DropdownMenuCloseOptions) => void;
}

export interface DropdownMenuItemProps {
    id: string;
    type: 'button';
    role: 'menuitem';
    tabindex: -1;
    class: string[];
    'aria-controls'?: string;
    'aria-expanded'?: boolean;
    'aria-haspopup'?: 'menu';
    'aria-disabled'?: true;
    'data-disabled'?: true;
    'data-focused'?: true;
    'data-submenu'?: true;
    onClick: (event: MouseEvent) => void;
    onMouseenter: (event: MouseEvent) => void;
}

export interface DropdownMenuSubmenuProps {
    id: string;
    role: 'menu';
    class: string[];
    'aria-label'?: string;
    'aria-activedescendant'?: string;
}

export interface DropdownMenuRenderedItem {
    item: DropdownMenuItem;
    index: number;
    key: string;
    path: DropdownMenuItemPath;
    level: number;
    focused: boolean;
    disabled: boolean;
    hasSubmenu: boolean;
    submenuOpen: boolean;
    props: DropdownMenuItemProps;
    submenuProps?: DropdownMenuSubmenuProps;
    slotProps: DropdownMenuItemSlotProps;
    children: DropdownMenuRenderedItem[];
}

export interface DropdownMenuProps {
    id?: string;
    items?: DropdownMenuItem[];
    placement?: DropdownMenuPlacement;
    open?: boolean;
    disabled?: boolean;
    closeOnSelect?: boolean;
    ariaLabel?: string;
}
