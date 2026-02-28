import type { Size } from '@/types/common';

export interface TextareaProps {
    modelValue?: string;
    placeholder?: string;
    rows?: number;
    size?: Size;
    disabled?: boolean;
    readonly?: boolean;
    resize?: 'none' | 'vertical' | 'horizontal' | 'both';
    block?: boolean;
}
