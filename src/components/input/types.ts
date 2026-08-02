import type { InputHTMLAttributes } from 'vue';
import type { StylesApiProps } from '../../styles-api';

export const inputParts = ['root', 'input', 'left', 'right'] as const;

export type InputPart = (typeof inputParts)[number];

export type InputRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type InputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface InputProps extends StylesApiProps<InputPart> {
    id?: string;
    name?: string;
    form?: string;
    modelValue?: string;
    defaultValue?: string;
    type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
    size?: InputSize;
    radius?: InputRadius;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    invalid?: boolean;
    valid?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
    inputAttrs?: InputHTMLAttributes;
    validationMessage?: string;
}
