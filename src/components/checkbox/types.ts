export type CheckboxColor =
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'neutral';

export type CheckboxSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type CheckboxRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type CheckboxVariant = 'solid' | 'outline';

export interface CheckboxProps {
    id?: string;
    name?: string;
    modelValue: boolean;
    variant?: CheckboxVariant;
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
