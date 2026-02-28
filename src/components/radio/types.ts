import type { InjectionKey } from 'vue';
import type { Size } from '@/types/common';

export interface RadioProps {
    value: string | number;
    label?: string;
    disabled?: boolean;
}

export interface RadioGroupProps {
    modelValue?: string | number | null;
    size?: Size;
    disabled?: boolean;
    direction?: 'horizontal' | 'vertical';
}

export interface RadioGroupContext {
    modelValue: string | number | null;
    size: Size;
    disabled: boolean;
    select: (value: string | number) => void;
}

export const radioGroupKey = Symbol('radioGroup') as InjectionKey<RadioGroupContext>;
