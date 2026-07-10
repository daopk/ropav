import type { InputHTMLAttributes } from 'vue';

export type InputRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type InputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface InputProps {
    id?: string;
    name?: string;
    modelValue: string;
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
