import type { InjectionKey } from 'vue';

export type RadioColor =
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'neutral';

export type RadioSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type RadioVariant = 'solid' | 'outline';

export interface RadioProps {
    value: string | number;
    variant?: RadioVariant;
    color?: RadioColor;
    size?: RadioSize;
    disabled?: boolean;
}

export interface RadioGroupProps {
    id?: string;
    name?: string;
    modelValue: string | number | null;
    variant?: RadioVariant;
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
    variant?: RadioVariant;
    color?: RadioColor;
    size?: RadioSize;
    select: (value: string | number) => void;
}

export const radioGroupKey = Symbol('radioGroup') as InjectionKey<RadioGroupContext>;
