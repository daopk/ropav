import { computed, type CSSProperties } from 'vue';
import { bem } from '@/utils/bem';
import { getComponentVariantColorRoles } from '@/utils/componentColors';
import { clamp } from '@/utils/number';
import {
    getPaginationItems,
    normalizePaginationPage,
    normalizePaginationTotal,
} from './paginationModel';
import type { PaginationProps, UsePaginationReturn } from './types';

export {
    getPaginationItems,
    normalizePaginationPage,
    normalizePaginationTotal,
} from './paginationModel';

function getPaginationColorStyle(
    color: PaginationProps['color'],
    autoContrast: boolean,
    contrastColor: PaginationProps['contrastColor'],
): CSSProperties | undefined {
    const resolvedColor = color ?? 'primary';

    const roles = getComponentVariantColorRoles({
        color: resolvedColor,
        variant: 'solid',
        autoContrast,
        contrastColor,
    });
    if (!roles) return undefined;

    return {
        '--_rp-pagination-active-bg': roles.background,
        '--_rp-pagination-active-bg-hover': roles.hover,
        '--_rp-pagination-active-fg': roles.color,
        '--_rp-pagination-active-fg-hover': roles.colorHover,
    } as CSSProperties;
}

export function usePagination(
    props: Readonly<PaginationProps>,
    getCurrentValue: () => number,
    onChange: (page: number) => void,
): UsePaginationReturn {
    const totalPages = computed(() => normalizePaginationTotal(props.total));
    const currentPage = computed(() =>
        normalizePaginationPage(getCurrentValue(), totalPages.value),
    );
    const items = computed(() =>
        getPaginationItems(
            totalPages.value,
            currentPage.value,
            props.siblings ?? 1,
            props.boundaries ?? 1,
        ),
    );
    const rootClass = computed(() =>
        bem('rp-pagination', {
            [`size-${props.size}`]: Boolean(props.size),
            [`radius-${props.radius}`]: Boolean(props.radius),
            disabled: props.disabled,
        }),
    );
    const rootStyle = computed(() =>
        getPaginationColorStyle(props.color, props.autoContrast ?? true, props.contrastColor),
    );
    const firstPage = computed(() => 1);
    const previousPage = computed(() => Math.max(1, currentPage.value - 1));
    const nextPage = computed(() => clamp(currentPage.value + 1, 1, Math.max(totalPages.value, 1)));
    const lastPage = computed(() => Math.max(totalPages.value, 1));
    const isFirstDisabled = computed(
        () => props.disabled || totalPages.value === 0 || currentPage.value <= 1,
    );
    const isLastDisabled = computed(
        () => props.disabled || totalPages.value === 0 || currentPage.value >= totalPages.value,
    );

    function selectPage(page: number) {
        if (props.disabled || totalPages.value === 0) return false;

        const next = normalizePaginationPage(page, totalPages.value);
        if (next === currentPage.value) return false;

        onChange(next);
        return true;
    }

    return {
        totalPages,
        currentPage,
        items,
        rootClass,
        rootStyle,
        firstPage,
        previousPage,
        nextPage,
        lastPage,
        isFirstDisabled,
        isLastDisabled,
        selectPage,
    };
}
