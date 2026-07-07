import type { ComponentColorValue } from '../../utils/componentColors';

export type ButtonColor = ComponentColorValue;

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ButtonRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ButtonVariant = 'solid' | 'subtle' | 'surface' | 'outline' | 'ghost' | 'plain';

export interface ButtonProps {
    variant?: ButtonVariant;
    color?: ButtonColor;
    size?: ButtonSize;
    radius?: ButtonRadius;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
}
