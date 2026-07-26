import type { InjectionKey, InputHTMLAttributes } from 'vue';
import type { ComponentColorValue } from '../../utils/componentColors';
import type { StylesApiProps } from '../../styles-api';

export const radioParts = ['root', 'input', 'indicator', 'label'] as const;
export const radioGroupParts = ['root'] as const;
export type RadioPart = (typeof radioParts)[number];
export type RadioGroupPart = (typeof radioGroupParts)[number];

export type RadioColor = ComponentColorValue;

export type RadioSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type RadioVariant = 'solid' | 'outline';

export type RadioGroupOrientation = 'horizontal' | 'vertical';

export interface RadioProps extends StylesApiProps<RadioPart> {
    id?: string;
    name?: string;
    form?: string;
    value: string | number;
    checked?: boolean;
    variant?: RadioVariant;
    color?: RadioColor;
    autoContrast?: boolean;
    contrastColor?: string;
    size?: RadioSize;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
    inputAttrs?: InputHTMLAttributes;
    validationMessage?: string;
}

export interface RadioGroupProps extends StylesApiProps<RadioGroupPart> {
    id?: string;
    name?: string;
    form?: string;
    modelValue?: string | number | null;
    defaultValue?: string | number | null;
    variant?: RadioVariant;
    color?: RadioColor;
    autoContrast?: boolean;
    contrastColor?: string;
    size?: RadioSize;
    orientation?: RadioGroupOrientation;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
    inputAttrs?: InputHTMLAttributes;
    validationMessage?: string;
}

export interface RadioGroupRegistration {
    input: HTMLInputElement;
    value: () => string | number;
    disabled: () => boolean;
    checked: () => boolean;
    validationMessage: () => string | undefined;
}

export interface RadioGroupContext {
    modelValue: string | number | null;
    name: string;
    form: string | undefined;
    disabled: boolean;
    required: boolean;
    invalid: boolean;
    variant?: RadioVariant;
    color?: RadioColor;
    autoContrast?: boolean;
    contrastColor?: string;
    size?: RadioSize;
    inputAttrs: InputHTMLAttributes | undefined;
    select: (value: string | number) => void;
    register: (registration: RadioGroupRegistration) => () => void;
}

export const radioGroupKey = Symbol('radioGroup') as InjectionKey<RadioGroupContext>;
