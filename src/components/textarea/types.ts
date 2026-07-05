export type TextareaRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type TextareaSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface TextareaProps {
    id?: string;
    name?: string;
    modelValue: string;
    size?: TextareaSize;
    radius?: TextareaRadius;
    placeholder?: string;
    rows?: number;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    invalid?: boolean;
    valid?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
}
