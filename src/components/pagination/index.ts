export { default as Pagination } from './pagination.vue';
export { paginationColors, paginationParts, paginationRadiuses, paginationSizes } from './types';
export type {
    PaginationColor,
    PaginationControl,
    PaginationControlSlotProps,
    PaginationEllipsisItem,
    PaginationGetPageAriaLabel,
    PaginationItem,
    PaginationPageItem,
    PaginationPageSlotProps,
    PaginationPart,
    PaginationProps,
    PaginationRadius,
    PaginationSize,
} from './types';
export {
    getPaginationItems,
    normalizePaginationPage,
    normalizePaginationTotal,
    usePagination,
} from './usePagination';
