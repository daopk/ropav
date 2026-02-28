import type { Size } from '@/types/common';

export interface InputProps {
    modelValue?: string | number;
    type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
    placeholder?: string;
    size?: Size;
    disabled?: boolean;
    readonly?: boolean;
    clearable?: boolean;
    copyable?: boolean;
    viewable?: boolean;
    block?: boolean;
}
