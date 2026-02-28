import type { Size } from '@/types/common';

export interface FieldProps {
    label?: string;
    description?: string;
    error?: string;
    success?: string;
    required?: boolean;
    disabled?: boolean;
    size?: Size;
}
