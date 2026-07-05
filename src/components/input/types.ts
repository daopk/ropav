export type InputRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface InputProps {
    id?: string;
    name?: string;
    modelValue: string;
    type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
    radius?: InputRadius;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    invalid?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
}
