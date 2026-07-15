import type { InputHTMLAttributes } from 'vue';
import type { ComponentColorValue } from '../../utils/componentColors';

export type CheckboxColor = ComponentColorValue;

export type CheckboxSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type CheckboxRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type CheckboxVariant = 'solid' | 'outline';

export interface CheckboxProps {
    id?: string;
    name?: string;
    modelValue: boolean;
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
}
