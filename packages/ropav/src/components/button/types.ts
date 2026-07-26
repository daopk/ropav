import type { ComponentColorValue } from '../../utils/componentColors';
import type { StylesApiProps } from '../../styles-api';

export const buttonParts = ['root', 'loader', 'left', 'label', 'right'] as const;

export type ButtonPart = (typeof buttonParts)[number];

export type ButtonColor = ComponentColorValue;

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ButtonRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ButtonVariant = 'solid' | 'subtle' | 'surface' | 'outline' | 'ghost' | 'plain';

export interface ButtonProps extends StylesApiProps<ButtonPart> {
    variant?: ButtonVariant;
    color?: ButtonColor;
    autoContrast?: boolean;
    contrastColor?: string;
    size?: ButtonSize;
    radius?: ButtonRadius;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
}
