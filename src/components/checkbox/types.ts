import type { InputHTMLAttributes } from 'vue';
import type { ComponentColorValue } from '../../utils/componentColors';
import type { StylesApiProps } from '../../styles-api';

export const checkboxParts = ['root', 'input', 'indicator', 'label'] as const;
export type CheckboxPart = (typeof checkboxParts)[number];

export type CheckboxColor = ComponentColorValue;

export type CheckboxSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type CheckboxRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type CheckboxVariant = 'solid' | 'outline';

export interface CheckboxProps extends StylesApiProps<CheckboxPart> {
    id?: string;
    name?: string;
    form?: string;
    modelValue?: boolean;
    defaultValue?: boolean;
    value?: string | number;
    variant?: CheckboxVariant;
    color?: CheckboxColor;
    autoContrast?: boolean;
    size?: CheckboxSize;
    radius?: CheckboxRadius;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
    indeterminate?: boolean;
    inputAttrs?: InputHTMLAttributes;
    validationMessage?: string;
}
