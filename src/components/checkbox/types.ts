export interface CheckboxProps {
    id?: string;
    name?: string;
    modelValue: boolean;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
    indeterminate?: boolean;
}
