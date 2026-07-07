export type TextareaRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type TextareaSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type TextareaResize = 'none' | 'vertical' | 'both';

export interface TextareaProps {
    id?: string;
    name?: string;
    modelValue: string;
    size?: TextareaSize;
    radius?: TextareaRadius;
    resize?: TextareaResize;
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
