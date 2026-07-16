import type { SelectHTMLAttributes } from 'vue';
import type { StylesApiProps } from '../../styles-api';

export interface SelectOption {
    label: string;
    value: string | number;
    disabled?: boolean;
}

export type SelectRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type SelectSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface SelectProps extends StylesApiProps<SelectPart> {
    id?: string;
    name?: string;
    form?: string;
    modelValue?: string | number | null;
    defaultValue?: string | number | null;
    options?: SelectOption[];
    size?: SelectSize;
    radius?: SelectRadius;
    placeholder?: string;
    clearable?: boolean;
    clearLabel?: string;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
    inputAttrs?: SelectHTMLAttributes;
    validationMessage?: string;
}

export const selectParts = [
    'root',
    'trigger',
    'value',
    'indicator',
    'clear',
    'content',
    'option',
    'empty',
] as const;

export type SelectPart = (typeof selectParts)[number];
