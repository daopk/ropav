export type SwitchColor = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

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
