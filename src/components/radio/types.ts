import type { InjectionKey } from 'vue';

export type RadioColor = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

export type RadioSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface RadioProps {
    value: string | number;
    color?: RadioColor;
    size?: RadioSize;
    disabled?: boolean;
}

export interface RadioGroupProps {
    id?: string;
    name?: string;
    modelValue: string | number | null;
    color?: RadioColor;
    size?: RadioSize;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
}

export interface RadioGroupContext {
    modelValue: string | number | null;
    name: string;
    disabled: boolean;
    required: boolean;
    color?: RadioColor;
    size?: RadioSize;
    select: (value: string | number) => void;
}

export const radioGroupKey = Symbol('radioGroup') as InjectionKey<RadioGroupContext>;
