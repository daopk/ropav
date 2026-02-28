import type { Size } from '@/types/common';

export interface CheckboxProps {
    modelValue?: boolean;
    label?: string;
    size?: Size;
    disabled?: boolean;
    indeterminate?: boolean;
}
