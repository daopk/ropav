import type { InjectionKey, InputHTMLAttributes } from 'vue';
import type { ComponentColorValue } from '../../utils/componentColors';

export type RadioColor = ComponentColorValue;

export type RadioSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type RadioVariant = 'solid' | 'outline';

export type RadioGroupOrientation = 'horizontal' | 'vertical';

export interface RadioProps {
    id?: string;
    name?: string;
    value: string | number;
    checked?: boolean;
    variant?: RadioVariant;
    color?: RadioColor;
    autoContrast?: boolean;
    size?: RadioSize;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
    inputAttrs?: InputHTMLAttributes;
}

export interface RadioGroupProps {
    id?: string;
    name?: string;
    modelValue: string | number | null;
    variant?: RadioVariant;
    color?: RadioColor;
    autoContrast?: boolean;
    size?: RadioSize;
    orientation?: RadioGroupOrientation;
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
    invalid: boolean;
    variant?: RadioVariant;
    color?: RadioColor;
    autoContrast?: boolean;
    size?: RadioSize;
    select: (value: string | number) => void;
}

export const radioGroupKey = Symbol('radioGroup') as InjectionKey<RadioGroupContext>;
