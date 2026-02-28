import type { InjectionKey } from 'vue';
import type { Size } from '@/types/common';

export interface DropdownProps {
    size?: Size;
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
    size: Size;
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

export const dropdownKey = Symbol('dropdown') as InjectionKey<DropdownContext>;
export const dropdownRadioGroupKey = Symbol('dropdown-radio-group') as InjectionKey<DropdownRadioContext>;
export const dropdownSubKey = Symbol('dropdown-sub') as InjectionKey<DropdownSubContext>;
