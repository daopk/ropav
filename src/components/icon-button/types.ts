import type { ButtonColor, ButtonRadius, ButtonSize, ButtonVariant } from '../button/types';
import type { StylesApiProps } from '../../styles-api';

export const iconButtonParts = ['root', 'loader', 'icon'] as const;
export type IconButtonPart = (typeof iconButtonParts)[number];

export type IconButtonColor = ButtonColor;

export type IconButtonSize = ButtonSize;

export type IconButtonRadius = ButtonRadius;

export type IconButtonVariant = ButtonVariant;

export interface IconButtonProps extends StylesApiProps<IconButtonPart> {
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
