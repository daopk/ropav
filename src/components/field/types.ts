import type { InjectionKey } from 'vue';
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

export interface FieldContext {
    id: string;
    size: Size;
    disabled: boolean;
    error: boolean;
}

export const fieldKey = Symbol('field') as InjectionKey<FieldContext>;
