import type { ButtonColor, ButtonRadius, ButtonSize, ButtonVariant } from '../button/types';
import type { StylesApiProps } from '../../styles-api';

export const buttonLinkParts = ['root', 'loader', 'left', 'label', 'right'] as const;
export type ButtonLinkPart = (typeof buttonLinkParts)[number];

export type ButtonLinkColor = ButtonColor;

export type ButtonLinkSize = ButtonSize;

export type ButtonLinkRadius = ButtonRadius;

export type ButtonLinkVariant = ButtonVariant;

export type ButtonLinkTarget = '_self' | '_blank' | '_parent' | '_top' | (string & {});

export interface ButtonLinkProps extends StylesApiProps<ButtonLinkPart> {
    href?: string;
    target?: ButtonLinkTarget;
    rel?: string;
    download?: string | boolean;
    hreflang?: string;
    variant?: ButtonLinkVariant;
    color?: ButtonLinkColor;
    autoContrast?: boolean;
    size?: ButtonLinkSize;
    radius?: ButtonLinkRadius;
    disabled?: boolean;
    loading?: boolean;
}
