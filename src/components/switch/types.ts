import type { ComponentColorValue } from '../../utils/componentColors';

export type SwitchColor = ComponentColorValue;

export type SwitchSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface SwitchProps {
    id?: string;
    name?: string;
    modelValue: boolean;
    color?: SwitchColor;
    size?: SwitchSize;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
}
