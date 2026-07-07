export type ButtonGroupOrientation = 'horizontal' | 'vertical';

export interface ButtonGroupProps {
    id?: string;
    orientation?: ButtonGroupOrientation;
    attached?: boolean;
    wrap?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
}
