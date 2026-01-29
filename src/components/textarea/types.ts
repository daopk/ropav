export interface TextareaProps {
    modelValue?: string;
    placeholder?: string;
    rows?: number;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    readonly?: boolean;
    resize?: 'none' | 'vertical' | 'horizontal' | 'both';
    block?: boolean;
}
