import type { InjectionKey } from 'vue';

export interface RadioProps {
    value: string | number;
    label?: string;
    disabled?: boolean;
}

export interface RadioGroupProps {
    modelValue?: string | number | null;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    direction?: 'horizontal' | 'vertical';
}

export interface RadioGroupContext {
    modelValue: string | number | null;
    size: 'sm' | 'md' | 'lg';
    disabled: boolean;
    select: (value: string | number) => void;
}

export const radioGroupKey: InjectionKey<RadioGroupContext> = Symbol('radioGroup');
