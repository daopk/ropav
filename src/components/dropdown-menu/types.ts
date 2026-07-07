export type DropdownMenuPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

export type DropdownMenuItemValue = string | number;

export type DropdownMenuFocusTarget = 'first' | 'last';

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
    focused: boolean;
    disabled: boolean;
    select: () => void;
    close: (options?: DropdownMenuCloseOptions) => void;
}

export interface DropdownMenuItemProps {
    id: string;
    type: 'button';
    role: 'menuitem';
    class: string[];
    'aria-disabled'?: true;
    'data-disabled'?: true;
    'data-focused'?: true;
    onClick: (event: MouseEvent) => void;
    onMouseenter: (event: MouseEvent) => void;
}

export interface DropdownMenuRenderedItem {
    item: DropdownMenuItem;
    index: number;
    key: DropdownMenuItemValue;
    focused: boolean;
    disabled: boolean;
    props: DropdownMenuItemProps;
    slotProps: DropdownMenuItemSlotProps;
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
