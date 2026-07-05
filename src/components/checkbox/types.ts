export type CheckboxColor = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

export type CheckboxSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type CheckboxRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface CheckboxProps {
    id?: string;
    name?: string;
    modelValue: boolean;
    color?: CheckboxColor;
    size?: CheckboxSize;
    radius?: CheckboxRadius;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
    indeterminate?: boolean;
}
