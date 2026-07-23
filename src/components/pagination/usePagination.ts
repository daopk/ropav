import { computed, type CSSProperties } from 'vue';
import { bem } from '@/utils/bem';
import { getComponentVariantColorRoles } from '@/utils/componentColors';
import { clamp } from '@/utils/number';
import type { PaginationItem, PaginationProps } from './types';

function normalizeCount(value: number, fallback: number) {
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

export function normalizePaginationTotal(total: number) {
    return normalizeCount(total, 0);
}

export function normalizePaginationPage(page: number, total: number) {
    const safeTotal = normalizePaginationTotal(total);
    const safePage = Number.isFinite(page) ? Math.floor(page) : 1;

    return clamp(safePage, 1, Math.max(safeTotal, 1));
}

function getRange(start: number, end: number) {
    return Array.from({ length: Math.max(end - start + 1, 0) }, (_, index) => start + index);
}

export function getPaginationItems(
    total: number,
    page: number,
    siblings = 1,
    boundaries = 1,
): PaginationItem[] {
    const safeTotal = normalizePaginationTotal(total);
    if (safeTotal === 0) return [];

    const currentPage = normalizePaginationPage(page, safeTotal);
    const siblingCount = normalizeCount(siblings, 1);
    const boundaryCount = normalizeCount(boundaries, 1);
    const itemCount = siblingCount * 2 + boundaryCount * 2 + 3;

    if (safeTotal <= itemCount) {
        return getRange(1, safeTotal).map((pageValue) => ({
            type: 'page',
            key: `page-${pageValue}`,
            page: pageValue,
        }));
    }

    const leftSibling = Math.max(currentPage - siblingCount, boundaryCount);
    const rightSibling = Math.min(currentPage + siblingCount, safeTotal - boundaryCount);
    const showLeftEllipsis = leftSibling > boundaryCount + 2;
    const showRightEllipsis = rightSibling < safeTotal - boundaryCount - 1;
    let pages: number[];

    if (!showLeftEllipsis && showRightEllipsis) {
        const leftItemCount = siblingCount * 2 + boundaryCount + 2;
        pages = [
            ...getRange(1, leftItemCount),
            ...getRange(safeTotal - boundaryCount + 1, safeTotal),
        ];
    } else if (showLeftEllipsis && !showRightEllipsis) {
        const rightItemCount = siblingCount * 2 + boundaryCount + 2;
        pages = [
            ...getRange(1, boundaryCount),
            ...getRange(safeTotal - rightItemCount + 1, safeTotal),
        ];
    } else {
        pages = [
            ...getRange(1, boundaryCount),
            ...getRange(leftSibling, rightSibling),
            ...getRange(safeTotal - boundaryCount + 1, safeTotal),
        ];
    }

    const items: PaginationItem[] = [];
    let previous = 0;

    function addGap(next: number) {
        const missingPages = next - previous - 1;
        if (missingPages === 1) {
            const pageValue = previous + 1;
            items.push({ type: 'page', key: `page-${pageValue}`, page: pageValue });
        } else if (missingPages > 1) {
            items.push({ type: 'ellipsis', key: `ellipsis-${previous}-${next}` });
        }
    }

    for (const pageValue of pages) {
        addGap(pageValue);
        items.push({ type: 'page', key: `page-${pageValue}`, page: pageValue });
        previous = pageValue;
    }

    addGap(safeTotal + 1);
    return items;
}

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
) {
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
