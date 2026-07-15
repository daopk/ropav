import type { StylesApiProps } from '../../styles-api';

export const buttonGroupParts = ['root'] as const;
export type ButtonGroupPart = (typeof buttonGroupParts)[number];

export type ButtonGroupOrientation = 'horizontal' | 'vertical';

export interface ButtonGroupProps extends StylesApiProps<ButtonGroupPart> {
    id?: string;
    orientation?: ButtonGroupOrientation;
    attached?: boolean;
    wrap?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
}
