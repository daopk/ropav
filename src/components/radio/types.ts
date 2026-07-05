import type { InjectionKey } from 'vue';

export interface RadioProps {
    value: string | number;
    disabled?: boolean;
}

export interface RadioGroupProps {
    id?: string;
    name?: string;
    modelValue: string | number | null;
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
    select: (value: string | number) => void;
}

export const radioGroupKey = Symbol('radioGroup') as InjectionKey<RadioGroupContext>;
