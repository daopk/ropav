import { defineComponent, h, ref, type ComponentPublicInstance } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { flush, keydown, mountDom } from '../../../tests/utils/vue';
import ScrollArea from './scroll-area.vue';
import { scrollAreaParts, scrollAreaScrollbars, scrollAreaTypes } from './types';

interface ScrollAreaInstance extends ComponentPublicInstance {
    viewport: HTMLElement;
    scrollTo: (options: ScrollToOptions) => void;
    scrollBy: (options: ScrollToOptions) => void;
    update: () => void;
}

function setGeometry(
    element: HTMLElement,
    geometry: Partial<
        Record<'clientWidth' | 'clientHeight' | 'scrollWidth' | 'scrollHeight', number>
    >,
) {
    for (const [name, value] of Object.entries(geometry)) {
        Object.defineProperty(element, name, { configurable: true, value });
    }
}

function mountScrollArea(
    props: Record<string, unknown> = {},
    slot: () => unknown = () => h('div', { class: 'content' }, 'Scrollable content'),
) {
    const instance = ref<ScrollAreaInstance | null>(null);
    const container = mountDom(
        defineComponent({
            render() {
                return h(ScrollArea, { ...props, ref: instance }, { default: slot });
            },
        }),
    );

    return { container, instance };
}

describe('ScrollArea', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders a focusable viewport, content, custom scrollbars, and corner', async () => {
        const { container } = mountScrollArea({ id: 'activity', ariaLabel: 'Recent activity' });
        await flush();

        const root = container.querySelector('.rp-scroll-area') as HTMLElement;
        const viewport = container.querySelector('.rp-scroll-area__viewport') as HTMLElement;
        const content = container.querySelector('.rp-scroll-area__content') as HTMLElement;
        const scrollbars = container.querySelectorAll('.rp-scroll-area__scrollbar');

        expect(root.id).toBe('activity');
        expect(root.dataset.type).toBe('hover');
        expect(root.dataset.scrollbars).toBe('both');
        expect(root.style.getPropertyValue('--_rp-scroll-area-scrollbar-size')).toBe('10px');
        expect(viewport.id).toBe('activity-viewport');
        expect(viewport.tabIndex).toBe(0);
        expect(viewport.getAttribute('role')).toBe('region');
        expect(viewport.getAttribute('aria-label')).toBe('Recent activity');
        expect(content.textContent).toBe('Scrollable content');
        expect(scrollbars).toHaveLength(2);
        expect(container.querySelector('.rp-scroll-area__corner')).toBeTruthy();
    });

    it('measures both axes and exposes accessible scrollbar values', async () => {
        const { container, instance } = mountScrollArea({ type: 'auto' });
        await flush();

        const root = container.querySelector('.rp-scroll-area') as HTMLElement;
        const viewport = container.querySelector('.rp-scroll-area__viewport') as HTMLElement;
        const horizontal = container.querySelector(
            '.rp-scroll-area__scrollbar--horizontal',
        ) as HTMLElement;
        const vertical = container.querySelector(
            '.rp-scroll-area__scrollbar--vertical',
        ) as HTMLElement;
        setGeometry(viewport, {
            clientWidth: 200,
            clientHeight: 100,
            scrollWidth: 500,
            scrollHeight: 400,
        });
        setGeometry(horizontal, { clientWidth: 190 });
        setGeometry(vertical, { clientHeight: 90 });

        instance.value?.update();
        await flush();

        expect(root.dataset.overflowX).toBe('');
        expect(root.dataset.overflowY).toBe('');
        expect(root.dataset.scrollbarXVisible).toBe('');
        expect(root.dataset.scrollbarYVisible).toBe('');
        expect(horizontal.getAttribute('role')).toBe('scrollbar');
        expect(horizontal.getAttribute('aria-orientation')).toBe('horizontal');
        expect(horizontal.getAttribute('aria-valuemax')).toBe('300');
        expect(horizontal.getAttribute('aria-controls')).toBe(viewport.id);
        expect(vertical.getAttribute('aria-valuemax')).toBe('300');
        expect(vertical.getAttribute('aria-disabled')).toBeNull();
        expect(
            (horizontal.firstElementChild as HTMLElement).style.getPropertyValue(
                '--_rp-scroll-area-thumb-size',
            ),
        ).toBe('40%');
        expect(
            (vertical.firstElementChild as HTMLElement).style.getPropertyValue(
                '--_rp-scroll-area-thumb-size',
            ),
        ).toBe('25%');
    });

    it('shows hover scrollbars during pointer and focus interaction', async () => {
        const { container, instance } = mountScrollArea({ scrollbars: 'y' });
        await flush();

        const root = container.querySelector('.rp-scroll-area') as HTMLElement;
        const viewport = container.querySelector('.rp-scroll-area__viewport') as HTMLElement;
        setGeometry(viewport, { clientHeight: 100, scrollHeight: 300 });
        instance.value?.update();
        await flush();

        expect(root.dataset.scrollbarYVisible).toBeUndefined();

        root.dispatchEvent(new Event('pointerenter'));
        await flush();
        expect(root.dataset.scrollbarYVisible).toBe('');

        root.dispatchEvent(new Event('pointerleave'));
        await flush();
        expect(root.dataset.scrollbarYVisible).toBeUndefined();

        viewport.focus();
        await flush();
        expect(root.dataset.scrollbarYVisible).toBe('');

        viewport.blur();
        await flush();
        expect(root.dataset.scrollbarYVisible).toBeUndefined();
    });

    it('shows scroll-mode bars while scrolling and hides them after the delay', async () => {
        vi.useFakeTimers();
        const { container, instance } = mountScrollArea({
            type: 'scroll',
            scrollbars: 'y',
            scrollHideDelay: 120,
        });
        await flush();

        const root = container.querySelector('.rp-scroll-area') as HTMLElement;
        const viewport = container.querySelector('.rp-scroll-area__viewport') as HTMLElement;
        setGeometry(viewport, { clientHeight: 100, scrollHeight: 300 });
        instance.value?.update();
        viewport.scrollTop = 40;
        viewport.dispatchEvent(new Event('scroll'));
        await flush();

        expect(root.dataset.scrollbarYVisible).toBe('');

        vi.advanceTimersByTime(120);
        await flush();
        expect(root.dataset.scrollbarYVisible).toBeUndefined();
    });

    it('emits native and normalized position events from the viewport', async () => {
        const onScroll = vi.fn();
        const onPositionChange = vi.fn();
        const viewportOnScroll = vi.fn();
        const { container, instance } = mountScrollArea({
            onScroll,
            onScrollPositionChange: onPositionChange,
            viewportAttrs: { onScroll: viewportOnScroll },
        });
        await flush();

        const viewport = container.querySelector('.rp-scroll-area__viewport') as HTMLElement;
        setGeometry(viewport, {
            clientWidth: 100,
            clientHeight: 100,
            scrollWidth: 300,
            scrollHeight: 400,
        });
        instance.value?.update();
        viewport.scrollLeft = 25;
        viewport.scrollTop = 60;
        viewport.dispatchEvent(new Event('scroll'));
        await flush();

        expect(onScroll).toHaveBeenCalledOnce();
        expect(viewportOnScroll).toHaveBeenCalledOnce();
        expect(onPositionChange).toHaveBeenLastCalledWith({ x: 25, y: 60 });
    });

    it('supports keyboard scrolling on the custom scrollbar', async () => {
        const { container, instance } = mountScrollArea({ type: 'always', scrollbars: 'y' });
        await flush();

        const viewport = container.querySelector('.rp-scroll-area__viewport') as HTMLElement;
        const scrollbar = container.querySelector(
            '.rp-scroll-area__scrollbar--vertical',
        ) as HTMLElement;
        setGeometry(viewport, { clientHeight: 100, scrollHeight: 400 });
        instance.value?.update();
        await flush();

        keydown(scrollbar, 'End');
        await flush();
        expect(viewport.scrollTop).toBe(300);
        expect(scrollbar.getAttribute('aria-valuenow')).toBe('300');

        keydown(scrollbar, 'Home');
        await flush();
        expect(viewport.scrollTop).toBe(0);
    });

    it('exposes scroll methods and an update method', async () => {
        const { container, instance } = mountScrollArea({ scrollbars: 'both' });
        await flush();

        const viewport = container.querySelector('.rp-scroll-area__viewport') as HTMLElement;
        setGeometry(viewport, {
            clientWidth: 100,
            clientHeight: 100,
            scrollWidth: 300,
            scrollHeight: 400,
        });
        instance.value?.update();
        instance.value?.scrollTo({ left: 30, top: 40 });
        instance.value?.update();

        expect(instance.value?.viewport).toBe(viewport);
        expect(viewport.scrollLeft).toBe(30);
        expect(viewport.scrollTop).toBe(40);

        instance.value?.scrollBy({ left: 10, top: 15 });
        instance.value?.update();
        expect(viewport.scrollLeft).toBe(40);
        expect(viewport.scrollTop).toBe(55);
    });

    it('supports axis selection, never mode, forwarded attributes, and Styles API parts', async () => {
        const { container } = mountScrollArea({
            type: 'never',
            scrollbars: 'x',
            scrollbarSize: '0.75rem',
            class: 'custom-root',
            classNames: {
                viewport: 'custom-viewport',
                content: 'custom-content',
            },
            styles: { content: { padding: '12px' } },
            viewportAttrs: {
                class: 'viewport-compatibility',
                'data-testid': 'viewport',
                tabindex: -1,
            },
        });
        await flush();

        const root = container.querySelector('.rp-scroll-area') as HTMLElement;
        const viewport = container.querySelector('.rp-scroll-area__viewport') as HTMLElement;
        const content = container.querySelector('.rp-scroll-area__content') as HTMLElement;

        expect([...root.classList]).toEqual(['rp-scroll-area', 'custom-root']);
        expect(root.dataset.type).toBe('never');
        expect(root.dataset.scrollbars).toBe('x');
        expect(root.style.getPropertyValue('--_rp-scroll-area-scrollbar-size')).toBe('0.75rem');
        expect(viewport.classList.contains('custom-viewport')).toBe(true);
        expect(viewport.classList.contains('viewport-compatibility')).toBe(true);
        expect(viewport.dataset.testid).toBe('viewport');
        expect(viewport.tabIndex).toBe(-1);
        expect(content.classList.contains('custom-content')).toBe(true);
        expect(content.style.padding).toBe('12px');
        expect(container.querySelector('.rp-scroll-area__scrollbar')).toBeNull();
    });

    it('exports the supported public option and part catalogs', () => {
        expect(scrollAreaTypes).toEqual(['auto', 'always', 'hover', 'scroll', 'never']);
        expect(scrollAreaScrollbars).toEqual(['x', 'y', 'both']);
        expect(scrollAreaParts).toEqual([
            'root',
            'viewport',
            'content',
            'scrollbar',
            'thumb',
            'corner',
        ]);
    });
});
