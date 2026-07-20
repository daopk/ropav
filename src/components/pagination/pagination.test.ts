import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';

import { click, flush, mountDom } from '../../../tests/utils/vue';
import Pagination from './pagination.vue';
import {
    getPaginationItems,
    normalizePaginationPage,
    normalizePaginationTotal,
} from './usePagination';

function itemValues(total: number, page: number, siblings = 1, boundaries = 1) {
    return getPaginationItems(total, page, siblings, boundaries).map((item) =>
        item.type === 'page' ? item.page : 'ellipsis',
    );
}

describe('Pagination', () => {
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

    it('renders accessible navigation and updates an uncontrolled page', async () => {
        const onUpdate = vi.fn();
        const onChange = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Pagination, {
                        total: 10,
                        defaultValue: 3,
                        withEdges: true,
                        ariaLabel: 'Search results pages',
                        'onUpdate:modelValue': onUpdate,
                        onChange,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-pagination') as HTMLElement;
        const active = container.querySelector('[aria-current="page"]') as HTMLButtonElement;
        const pageFour = container.querySelector('[data-page="4"]') as HTMLButtonElement;
        const first = container.querySelector('[data-control="first"]') as HTMLButtonElement;
        const previous = container.querySelector('[data-control="previous"]') as HTMLButtonElement;
        const next = container.querySelector('[data-control="next"]') as HTMLButtonElement;
        const last = container.querySelector('[data-control="last"]') as HTMLButtonElement;

        expect(root.tagName).toBe('NAV');
        expect(root.getAttribute('aria-label')).toBe('Search results pages');
        expect(root.dataset.page).toBe('3');
        expect(root.dataset.total).toBe('10');
        expect([...root.classList]).toEqual([
            'rp-pagination',
            'rp-pagination--size-md',
            'rp-pagination--radius-sm',
        ]);
        expect(active.textContent?.trim()).toBe('3');
        expect(active.getAttribute('aria-label')).toBe('Page 3, current page');
        expect(pageFour.getAttribute('aria-label')).toBe('Go to page 4');
        expect(first.getAttribute('aria-label')).toBe('Go to first page');
        expect(previous.getAttribute('aria-label')).toBe('Go to previous page');
        expect(next.getAttribute('aria-label')).toBe('Go to next page');
        expect(last.getAttribute('aria-label')).toBe('Go to last page');

        click(pageFour);
        await flush();

        expect(onUpdate).toHaveBeenCalledWith(4);
        expect(onChange).toHaveBeenCalledWith(4);
        expect(root.dataset.page).toBe('4');
        expect(pageFour.getAttribute('aria-current')).toBe('page');
    });

    it('supports controlled values and clamps navigation targets', async () => {
        const state = reactive({ page: 20, total: 8 });
        const onUpdate = vi.fn((page: number) => {
            state.page = page;
        });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Pagination, {
                        total: state.total,
                        modelValue: state.page,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-pagination') as HTMLElement;
        const previous = container.querySelector('[data-control="previous"]') as HTMLButtonElement;
        const next = container.querySelector('[data-control="next"]') as HTMLButtonElement;

        expect(root.dataset.page).toBe('8');
        expect(next.disabled).toBe(true);

        click(previous);
        await flush();

        expect(onUpdate).toHaveBeenCalledWith(7);
        expect(root.dataset.page).toBe('7');

        state.total = 4;
        await flush();
        expect(root.dataset.page).toBe('4');
    });

    it('disables all actions and handles an empty total', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Pagination, {
                        total: 0,
                        disabled: true,
                        withEdges: true,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-pagination') as HTMLElement;
        const controls = [...container.querySelectorAll<HTMLButtonElement>('[data-control]')];

        expect(root.hasAttribute('data-disabled')).toBe(true);
        expect(root.dataset.total).toBe('0');
        expect(container.querySelector('.rp-pagination__page')).toBeNull();
        expect(controls).toHaveLength(4);
        expect(controls.every((control) => control.disabled)).toBe(true);

        click(controls[0]);
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it('supports appearance props, Styles API, labels, and page slots', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Pagination,
                        {
                            id: 'orders-pagination',
                            total: 3,
                            defaultValue: 2,
                            color: 'red',
                            autoContrast: true,
                            size: 'lg',
                            radius: 'full',
                            labelledby: 'orders-title',
                            describedby: 'orders-help',
                            getPageAriaLabel: (page: number, active: boolean) =>
                                active ? `Order page ${page}, selected` : `Open order page ${page}`,
                            classNames: {
                                root: 'custom-root',
                                page: 'custom-page',
                            },
                            styles: { page: { fontWeight: 700 } },
                        },
                        {
                            page: ({ page, active }: { page: number; active: boolean }) =>
                                h('span', { class: 'page-slot' }, `${page}:${active}`),
                        },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-pagination') as HTMLElement;
        const active = container.querySelector('[aria-current="page"]') as HTMLButtonElement;

        expect(root.id).toBe('orders-pagination');
        expect([...root.classList]).toEqual([
            'rp-pagination',
            'rp-pagination--size-lg',
            'rp-pagination--radius-full',
            'custom-root',
        ]);
        expect(root.getAttribute('aria-labelledby')).toBe('orders-title');
        expect(root.getAttribute('aria-describedby')).toBe('orders-help');
        expect(root.style.getPropertyValue('--_rp-pagination-active-bg')).toBe(
            'var(--rp-color-red-filled)',
        );
        expect(root.style.getPropertyValue('--_rp-pagination-active-fg')).toBe(
            'var(--rp-color-red-contrast)',
        );
        expect(active.classList.contains('custom-page')).toBe(true);
        expect(active.style.fontWeight).toBe('700');
        expect(active.getAttribute('aria-label')).toBe('Order page 2, selected');
        expect(active.querySelector('.page-slot')?.textContent).toBe('2:true');
    });

    it('uses readable foregrounds for active page hover', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Pagination, {
                        total: 2,
                        color: '#e03131',
                        autoContrast: true,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-pagination') as HTMLElement;

        expect(root.style.getPropertyValue('--_rp-pagination-active-bg')).toBe('#e03131');
        expect(root.style.getPropertyValue('--_rp-pagination-active-bg-hover')).toBe(
            'color-mix(in srgb, #e03131 90%, var(--rp-color-black))',
        );
        expect(root.style.getPropertyValue('--_rp-pagination-active-fg')).toBe(
            'var(--rp-color-black)',
        );
        expect(root.style.getPropertyValue('--_rp-pagination-active-fg-hover')).toBe(
            'var(--rp-color-white)',
        );
    });
});
