import type { Size } from '@/types/common';

export interface SelectOption {
    label: string;
    value: string | number;
    disabled?: boolean;
}

export interface SelectProps {
    modelValue?: string | number | null;
    options?: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    clearable?: boolean;
    searchable?: boolean;
    size?: Size;
    block?: boolean;
}
