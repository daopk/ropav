export interface SelectOption {
    label: string;
    value: string | number;
    disabled?: boolean;
}

export type SelectRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface SelectProps {
    id?: string;
    name?: string;
    modelValue: string | number | null;
    options?: SelectOption[];
    radius?: SelectRadius;
    placeholder?: string;
    clearable?: boolean;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
}
