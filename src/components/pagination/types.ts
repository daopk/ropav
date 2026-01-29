export interface PaginationProps {
    modelValue?: number;
    total: number;
    pageSize?: number;
    siblingCount?: number;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
}
