import type { ButtonColor, ButtonRadius, ButtonSize, ButtonVariant } from '../button/types';

export type IconButtonColor = ButtonColor;

export type IconButtonSize = ButtonSize;

export type IconButtonRadius = ButtonRadius;

export type IconButtonVariant = ButtonVariant;

export interface IconButtonProps {
    ariaLabel: string;
    variant?: IconButtonVariant;
    color?: IconButtonColor;
    autoContrast?: boolean;
    size?: IconButtonSize;
    radius?: IconButtonRadius;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
}
