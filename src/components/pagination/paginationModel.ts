import { clamp } from '@/utils/number';
import type { PaginationItem } from './types';

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

function getCompactPageRange(
    total: number,
    currentPage: number,
    siblingCount: number,
    boundaryCount: number,
) {
    const leftSibling = Math.max(currentPage - siblingCount, boundaryCount);
    const rightSibling = Math.min(currentPage + siblingCount, total - boundaryCount);
    const showLeftEllipsis = leftSibling > boundaryCount + 2;
    const showRightEllipsis = rightSibling < total - boundaryCount - 1;

    if (!showLeftEllipsis && showRightEllipsis) {
        const leftItemCount = siblingCount * 2 + boundaryCount + 2;
        return [...getRange(1, leftItemCount), ...getRange(total - boundaryCount + 1, total)];
    }

    if (showLeftEllipsis && !showRightEllipsis) {
        const rightItemCount = siblingCount * 2 + boundaryCount + 2;
        return [...getRange(1, boundaryCount), ...getRange(total - rightItemCount + 1, total)];
    }

    return [
        ...getRange(1, boundaryCount),
        ...getRange(leftSibling, rightSibling),
        ...getRange(total - boundaryCount + 1, total),
    ];
}

function createPageItem(page: number): PaginationItem {
    return { type: 'page', key: `page-${page}`, page };
}

function createGapItem(previous: number, next: number): PaginationItem | undefined {
    const missingPages = next - previous - 1;
    if (missingPages === 1) return createPageItem(previous + 1);
    if (missingPages > 1) {
        return { type: 'ellipsis', key: `ellipsis-${previous}-${next}` };
    }

    return undefined;
}

function createPaginationItems(pages: readonly number[], total: number) {
    const items: PaginationItem[] = [];
    let previous = 0;

    for (const pageValue of pages) {
        const gapItem = createGapItem(previous, pageValue);
        if (gapItem) items.push(gapItem);
        items.push(createPageItem(pageValue));
        previous = pageValue;
    }

    const trailingGapItem = createGapItem(previous, total + 1);
    if (trailingGapItem) items.push(trailingGapItem);

    return items;
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
    const maxVisibleItems = siblingCount * 2 + boundaryCount * 2 + 3;
    const pages =
        safeTotal <= maxVisibleItems
            ? getRange(1, safeTotal)
            : getCompactPageRange(safeTotal, currentPage, siblingCount, boundaryCount);

    return createPaginationItems(pages, safeTotal);
}
