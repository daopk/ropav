export interface SelectOption {
    label: string;
    value: string | number;
    disabled?: boolean;
}

export type SelectRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type SelectSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface SelectProps {
    id?: string;
    name?: string;
    modelValue: string | number | null;
    options?: SelectOption[];
    size?: SelectSize;
    radius?: SelectRadius;
    placeholder?: string;
    clearable?: boolean;
    clearLabel?: string;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
}
