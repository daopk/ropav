import type { InjectionKey } from 'vue';

export interface DropdownProps {
    size?: 'sm' | 'md' | 'lg';
}

export interface DropdownContentProps {
    align?: 'start' | 'end';
}

export interface DropdownItemProps {
    disabled?: boolean;
    destructive?: boolean;
    shortcut?: string;
}

export interface DropdownCheckboxItemProps {
    modelValue?: boolean;
    disabled?: boolean;
}

export interface DropdownRadioGroupProps {
    modelValue?: string;
}

export interface DropdownRadioItemProps {
    value: string;
    disabled?: boolean;
}

export interface DropdownContext {
    isOpen: boolean;
    size: 'sm' | 'md' | 'lg';
    open: () => void;
    close: () => void;
    toggle: () => void;
}

export interface DropdownRadioContext {
    modelValue: string;
    select: (value: string) => void;
}

export interface DropdownSubContext {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    openImmediate: () => void;
    closeImmediate: () => void;
}

export const dropdownKey: InjectionKey<DropdownContext> = Symbol('dropdown');
export const dropdownRadioGroupKey: InjectionKey<DropdownRadioContext> = Symbol('dropdown-radio-group');
export const dropdownSubKey: InjectionKey<DropdownSubContext> = Symbol('dropdown-sub');
