import { describe, expect, it } from 'vitest';
import {
    getPaginationItems,
    normalizePaginationPage,
    normalizePaginationTotal,
} from './paginationModel';

function itemValues(total: number, page: number, siblings = 1, boundaries = 1) {
    return getPaginationItems(total, page, siblings, boundaries).map((item) =>
        item.type === 'page' ? item.page : 'ellipsis',
    );
}

describe('pagination model', () => {
    it('builds compact ranges with a stable item count', () => {
        expect(itemValues(20, 10)).toEqual([1, 'ellipsis', 9, 10, 11, 'ellipsis', 20]);
        expect(itemValues(7, 4)).toEqual([1, 2, 3, 4, 5, 6, 7]);
        expect(itemValues(20, 10, 0, 0)).toEqual(['ellipsis', 10, 'ellipsis']);
        expect(itemValues(0, 1)).toEqual([]);

        const ranges = Array.from({ length: 8 }, (_, index) => itemValues(8, index + 1));
        expect(ranges).toEqual([
            [1, 2, 3, 4, 5, 'ellipsis', 8],
            [1, 2, 3, 4, 5, 'ellipsis', 8],
            [1, 2, 3, 4, 5, 'ellipsis', 8],
            [1, 2, 3, 4, 5, 'ellipsis', 8],
            [1, 'ellipsis', 4, 5, 6, 7, 8],
            [1, 'ellipsis', 4, 5, 6, 7, 8],
            [1, 'ellipsis', 4, 5, 6, 7, 8],
            [1, 'ellipsis', 4, 5, 6, 7, 8],
        ]);
        expect(ranges.every((range) => range.length === 7)).toBe(true);

        for (const [siblings, boundaries] of [
            [0, 0],
            [0, 1],
            [1, 0],
            [2, 2],
        ]) {
            const lengths = Array.from({ length: 20 }, (_, index) =>
                itemValues(20, index + 1, siblings, boundaries),
            ).map((range) => range.length);
            expect(new Set(lengths)).toEqual(new Set([siblings * 2 + boundaries * 2 + 3]));
        }
    });

    it('normalizes totals and current pages', () => {
        expect(normalizePaginationTotal(8.9)).toBe(8);
        expect(normalizePaginationTotal(-2)).toBe(0);
        expect(normalizePaginationTotal(Number.NaN)).toBe(0);
        expect(normalizePaginationPage(0, 8)).toBe(1);
        expect(normalizePaginationPage(20, 8)).toBe(8);
        expect(normalizePaginationPage(Number.NaN, 8)).toBe(1);
    });

    it('uses documented defaults for invalid range options', () => {
        expect(itemValues(20, 10, Number.NaN, Number.NaN)).toEqual([
            1,
            'ellipsis',
            9,
            10,
            11,
            'ellipsis',
            20,
        ]);
        expect(itemValues(20, 10, -1, -1)).toEqual(['ellipsis', 10, 'ellipsis']);
    });
});
