import type { InputHTMLAttributes } from 'vue';
import type { StylesApiProps } from '../../styles-api';

export interface ComboboxOption {
    label: string;
    value: string | number;
    disabled?: boolean;
}

export type ComboboxFilter = (option: ComboboxOption, searchValue: string) => boolean;

export type ComboboxRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ComboboxSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ComboboxOptionSlotProps {
    option: ComboboxOption;
    selected: boolean;
    highlighted: boolean;
}

export interface ComboboxEmptySlotProps {
    searchValue: string;
}

export interface ComboboxProps extends StylesApiProps<ComboboxPart> {
    id?: string;
    name?: string;
    form?: string;
    modelValue?: string | number | null;
    defaultValue?: string | number | null;
    options?: ComboboxOption[];
    filter?: ComboboxFilter | false;
    size?: ComboboxSize;
    radius?: ComboboxRadius;
    placeholder?: string;
    clearable?: boolean;
    clearLabel?: string;
    toggleLabel?: string;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
    inputAttrs?: InputHTMLAttributes;
    validationMessage?: string;
}

export const comboboxParts = [
    'root',
    'input',
    'indicator',
    'clear',
    'toggle',
    'content',
    'option',
    'empty',
] as const;

export type ComboboxPart = (typeof comboboxParts)[number];
