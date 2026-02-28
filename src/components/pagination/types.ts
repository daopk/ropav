import type { Size } from '@/types/common';

export interface PaginationProps {
    modelValue?: number;
    total: number;
    pageSize?: number;
    siblingCount?: number;
    size?: Size;
    disabled?: boolean;
}
