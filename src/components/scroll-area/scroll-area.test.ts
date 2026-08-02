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

function setRect(element: Element, rect: Partial<DOMRect>) {
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        bottom: 100,
        height: 100,
        left: 0,
        right: 10,
        top: 0,
        width: 10,
        x: 0,
        y: 0,
        toJSON: () => ({}),
        ...rect,
    });
}

function dispatchPointer(
    target: EventTarget,
    type: 'pointerdown' | 'pointermove' | 'pointerup',
    clientY: number,
    clientX = 5,
) {
    const init = {
        bubbles: true,
        button: 0,
        cancelable: true,
        clientX,
        clientY,
        isPrimary: true,
        pointerId: 1,
    };
    const event =
        typeof window.PointerEvent === 'function'
            ? new PointerEvent(type, init)
            : new MouseEvent(type, init);
    if (!('pointerId' in event)) {
        Object.defineProperties(event, {
            isPrimary: { value: true },
            pointerId: { value: 1 },
        });
    }
    target.dispatchEvent(event);
}

function setRtlNegativeScrollModel(element: HTMLElement, maxPosition: number) {
    let scrollLeft = 0;

    Object.defineProperty(element, 'scrollLeft', {
        configurable: true,
        get: () => scrollLeft,
        set: (value: number) => {
            scrollLeft = Math.min(0, Math.max(-maxPosition, Number(value)));
        },
    });

    return () => scrollLeft;
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

    it.each(['x', 'y', 'both', false] as const)(
        'accepts scrollbars=%s without a Vue warning',
        async (scrollbars) => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

            try {
                mountScrollArea({ scrollbars });
                await flush();

                expect(warn).not.toHaveBeenCalled();
            } finally {
                warn.mockRestore();
            }
        },
    );

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
        expect(horizontal.tabIndex).toBe(0);
        expect(horizontal.getAttribute('aria-hidden')).toBeNull();
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

    it('emits each boundary event once when the viewport reaches that boundary', async () => {
        const onReachTop = vi.fn();
        const onReachBottom = vi.fn();
        const onReachLeft = vi.fn();
        const onReachRight = vi.fn();
        const { container, instance } = mountScrollArea({
            onReachTop,
            onReachBottom,
            onReachLeft,
            onReachRight,
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

        expect(onReachTop).not.toHaveBeenCalled();
        expect(onReachBottom).not.toHaveBeenCalled();
        expect(onReachLeft).not.toHaveBeenCalled();
        expect(onReachRight).not.toHaveBeenCalled();

        viewport.scrollLeft = 200;
        viewport.scrollTop = 300;
        viewport.dispatchEvent(new Event('scroll'));
        await flush();

        expect(onReachBottom).toHaveBeenCalledOnce();
        expect(onReachRight).toHaveBeenCalledOnce();

        viewport.dispatchEvent(new Event('scroll'));
        await flush();
        expect(onReachBottom).toHaveBeenCalledOnce();
        expect(onReachRight).toHaveBeenCalledOnce();

        viewport.scrollLeft = 0;
        viewport.scrollTop = 0;
        viewport.dispatchEvent(new Event('scroll'));
        await flush();

        expect(onReachTop).toHaveBeenCalledOnce();
        expect(onReachLeft).toHaveBeenCalledOnce();
        expect(onReachTop).toHaveBeenCalledWith(expect.any(Event));
        expect(onReachLeft).toHaveBeenCalledWith(expect.any(Event));

        viewport.scrollLeft = 50;
        viewport.scrollTop = 100;
        viewport.dispatchEvent(new Event('scroll'));
        viewport.scrollLeft = 200;
        viewport.scrollTop = 300;
        viewport.dispatchEvent(new Event('scroll'));
        await flush();

        expect(onReachBottom).toHaveBeenCalledTimes(2);
        expect(onReachRight).toHaveBeenCalledTimes(2);
    });

    it('maps horizontal boundary events to physical edges in RTL', async () => {
        const onReachLeft = vi.fn();
        const onReachRight = vi.fn();
        const onPositionChange = vi.fn();
        const { container, instance } = mountScrollArea({
            onReachLeft,
            onReachRight,
            onScrollPositionChange: onPositionChange,
        });
        await flush();

        const viewport = container.querySelector('.rp-scroll-area__viewport') as HTMLElement;
        viewport.style.direction = 'rtl';
        setGeometry(viewport, { clientWidth: 100, scrollWidth: 300 });
        instance.value?.update();

        viewport.scrollLeft = -200;
        viewport.dispatchEvent(new Event('scroll'));
        await flush();
        expect(onReachLeft).toHaveBeenCalledOnce();
        expect(onReachRight).not.toHaveBeenCalled();
        expect(onPositionChange).toHaveBeenLastCalledWith({ x: 200, y: 0 });

        viewport.scrollLeft = 0;
        viewport.dispatchEvent(new Event('scroll'));
        await flush();
        expect(onReachRight).toHaveBeenCalledOnce();
    });

    it('normalizes RTL negative positions across keyboard and wheel controls', async () => {
        const onPositionChange = vi.fn();
        const { container, instance } = mountScrollArea({
            type: 'always',
            scrollbars: 'x',
            onScrollPositionChange: onPositionChange,
        });
        await flush();

        const root = container.querySelector('.rp-scroll-area') as HTMLElement;
        const viewport = container.querySelector('.rp-scroll-area__viewport') as HTMLElement;
        const scrollbar = container.querySelector(
            '.rp-scroll-area__scrollbar--horizontal',
        ) as HTMLElement;
        const thumb = scrollbar.firstElementChild as HTMLElement;
        viewport.style.direction = 'rtl';
        setGeometry(viewport, { clientWidth: 100, scrollWidth: 300 });
        setGeometry(scrollbar, { clientWidth: 100 });
        const getScrollLeft = setRtlNegativeScrollModel(viewport, 200);

        instance.value?.update();
        await flush();

        expect(root.dataset.direction).toBe('rtl');
        expect(scrollbar.dataset.direction).toBe('rtl');
        expect(getScrollLeft()).toBe(0);

        keydown(scrollbar, 'ArrowLeft');
        await flush();
        expect(getScrollLeft()).toBe(-40);
        expect(scrollbar.getAttribute('aria-valuenow')).toBe('40');
        expect(
            Number.parseFloat(thumb.style.getPropertyValue('--_rp-scroll-area-thumb-offset')),
        ).toBeGreaterThan(0);

        viewport.dispatchEvent(new Event('scroll'));
        await flush();
        expect(onPositionChange).toHaveBeenLastCalledWith({ x: 40, y: 0 });

        const verticalWheel = new WheelEvent('wheel', {
            bubbles: true,
            cancelable: true,
            deltaY: 30,
        });
        scrollbar.dispatchEvent(verticalWheel);
        await flush();
        expect(verticalWheel.defaultPrevented).toBe(true);
        expect(getScrollLeft()).toBe(-70);

        const horizontalWheel = new WheelEvent('wheel', {
            bubbles: true,
            cancelable: true,
            deltaX: -20,
        });
        scrollbar.dispatchEvent(horizontalWheel);
        await flush();
        expect(getScrollLeft()).toBe(-90);

        keydown(scrollbar, 'ArrowRight');
        await flush();
        expect(getScrollLeft()).toBe(-50);

        keydown(scrollbar, 'Home');
        await flush();
        expect(getScrollLeft()).toBe(0);

        keydown(scrollbar, 'End');
        await flush();
        expect(getScrollLeft()).toBe(-200);
    });

    it('refreshes RTL direction when it changes after mount', async () => {
        const { container, instance } = mountScrollArea({ type: 'always', scrollbars: 'x' });
        await flush();

        const root = container.querySelector('.rp-scroll-area') as HTMLElement;
        const viewport = container.querySelector('.rp-scroll-area__viewport') as HTMLElement;
        const scrollbar = container.querySelector(
            '.rp-scroll-area__scrollbar--horizontal',
        ) as HTMLElement;
        setGeometry(viewport, { clientWidth: 100, scrollWidth: 300 });
        setGeometry(scrollbar, { clientWidth: 100 });
        const getScrollLeft = setRtlNegativeScrollModel(viewport, 200);

        instance.value?.update();
        expect(root.dataset.direction).toBe('ltr');

        root.dir = 'rtl';
        keydown(scrollbar, 'ArrowLeft');
        await flush();

        expect(root.dataset.direction).toBe('rtl');
        expect(scrollbar.dataset.direction).toBe('rtl');
        expect(getScrollLeft()).toBe(-40);
        expect(scrollbar.getAttribute('aria-valuenow')).toBe('40');

        root.removeAttribute('dir');
        await flush();
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        await flush();

        expect(root.dataset.direction).toBe('ltr');
        expect(scrollbar.dataset.direction).toBe('ltr');
    });

    it('mirrors horizontal track clicks and thumb dragging in RTL', async () => {
        const { container, instance } = mountScrollArea({ type: 'always', scrollbars: 'x' });
        await flush();

        const viewport = container.querySelector('.rp-scroll-area__viewport') as HTMLElement;
        const scrollbar = container.querySelector(
            '.rp-scroll-area__scrollbar--horizontal',
        ) as HTMLElement;
        const thumb = scrollbar.firstElementChild as HTMLElement;
        viewport.style.direction = 'rtl';
        setGeometry(viewport, { clientWidth: 100, scrollWidth: 300 });
        setGeometry(scrollbar, { clientWidth: 100 });
        setRect(scrollbar, { left: 0, right: 100, width: 100 });
        setRect(thumb, { left: 75, right: 100, width: 25 });
        const getScrollLeft = setRtlNegativeScrollModel(viewport, 200);

        instance.value?.update();
        await flush();

        dispatchPointer(scrollbar, 'pointerdown', 5, 12.5);
        await flush();
        expect(getScrollLeft()).toBe(-200);

        dispatchPointer(scrollbar, 'pointerdown', 5, 87.5);
        await flush();
        expect(getScrollLeft()).toBe(0);

        viewport.scrollLeft = -100;
        instance.value?.update();
        dispatchPointer(thumb, 'pointerdown', 5, 75);
        dispatchPointer(window, 'pointermove', 5, 50);
        await flush();
        expect(getScrollLeft()).toBeCloseTo(-166.67, 1);

        dispatchPointer(window, 'pointerup', 5, 50);
    });

    it('forwards thumb pointerdown events to root listeners', async () => {
        const targets: EventTarget[] = [];
        const onPointerdown = vi.fn((event: Event) => targets.push(event.target!));
        const { container, instance } = mountScrollArea({
            type: 'always',
            scrollbars: 'y',
            onPointerdown,
        });
        await flush();

        const viewport = container.querySelector('.rp-scroll-area__viewport') as HTMLElement;
        const scrollbar = container.querySelector(
            '.rp-scroll-area__scrollbar--vertical',
        ) as HTMLElement;
        const thumb = scrollbar.firstElementChild as HTMLElement;
        setGeometry(viewport, { clientHeight: 100, scrollHeight: 400 });
        setGeometry(scrollbar, { clientHeight: 100 });
        setRect(scrollbar, { height: 100 });
        setRect(thumb, { bottom: 25, height: 25 });
        instance.value?.update();
        await flush();

        dispatchPointer(thumb, 'pointerdown', 10);
        dispatchPointer(window, 'pointermove', 35);
        await flush();

        expect(onPointerdown).toHaveBeenCalledOnce();
        expect(targets).toEqual([thumb]);
        expect(viewport.scrollTop).toBe(100);
        dispatchPointer(window, 'pointerup', 10);
    });

    it('keeps scrollbar listeners stable while the scroll position changes', async () => {
        const { container, instance } = mountScrollArea({ type: 'always', scrollbars: 'y' });
        await flush();

        const viewport = container.querySelector('.rp-scroll-area__viewport') as HTMLElement;
        const scrollbar = container.querySelector(
            '.rp-scroll-area__scrollbar--vertical',
        ) as HTMLElement;
        const thumb = scrollbar.firstElementChild as HTMLElement;
        setGeometry(viewport, { clientHeight: 100, scrollHeight: 400 });
        setGeometry(scrollbar, { clientHeight: 100 });
        instance.value?.update();
        await flush();

        const scrollbarAdd = vi.spyOn(scrollbar, 'addEventListener');
        const scrollbarRemove = vi.spyOn(scrollbar, 'removeEventListener');
        const thumbAdd = vi.spyOn(thumb, 'addEventListener');
        const thumbRemove = vi.spyOn(thumb, 'removeEventListener');

        try {
            viewport.scrollTop = 40;
            viewport.dispatchEvent(new Event('scroll'));
            await flush();

            const interactionEvents = new Set(['keydown', 'pointerdown', 'wheel']);
            const interactionCalls = (calls: unknown[][]) =>
                calls.filter(([name]) => interactionEvents.has(String(name)));

            expect(scrollbar.getAttribute('aria-valuenow')).toBe('40');
            expect(interactionCalls(scrollbarAdd.mock.calls)).toEqual([]);
            expect(interactionCalls(scrollbarRemove.mock.calls)).toEqual([]);
            expect(interactionCalls(thumbAdd.mock.calls)).toEqual([]);
            expect(interactionCalls(thumbRemove.mock.calls)).toEqual([]);
        } finally {
            scrollbarAdd.mockRestore();
            scrollbarRemove.mockRestore();
            thumbAdd.mockRestore();
            thumbRemove.mockRestore();
        }
    });

    it('updates scroll position without rereading geometry', async () => {
        const onPositionChange = vi.fn();
        const { container, instance } = mountScrollArea({
            type: 'always',
            scrollbars: 'x',
            onScrollPositionChange: onPositionChange,
        });
        await flush();

        const viewport = container.querySelector('.rp-scroll-area__viewport') as HTMLElement;
        const scrollbar = container.querySelector(
            '.rp-scroll-area__scrollbar--horizontal',
        ) as HTMLElement;
        let geometryReads = 0;
        Object.defineProperties(viewport, {
            clientWidth: {
                configurable: true,
                get: () => {
                    geometryReads += 1;
                    return 100;
                },
            },
            scrollWidth: {
                configurable: true,
                get: () => {
                    geometryReads += 1;
                    return 300;
                },
            },
        });
        Object.defineProperty(scrollbar, 'clientWidth', {
            configurable: true,
            get: () => {
                geometryReads += 1;
                return 100;
            },
        });

        instance.value?.update();
        geometryReads = 0;
        viewport.scrollLeft = 25;
        viewport.dispatchEvent(new Event('scroll'));
        await flush();

        expect(onPositionChange).toHaveBeenLastCalledWith({ x: 25, y: 0 });
        expect(geometryReads).toBe(0);
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

    it('keeps embedded scrollbars hidden from focus and accessibility while pointer and wheel scrolling work', async () => {
        const { container, instance } = mountScrollArea({
            embedded: true,
            type: 'always',
            scrollbars: 'y',
        });
        await flush();

        const viewport = container.querySelector('.rp-scroll-area__viewport') as HTMLElement;
        const scrollbar = container.querySelector(
            '.rp-scroll-area__scrollbar--vertical',
        ) as HTMLElement;
        const thumb = scrollbar.firstElementChild as HTMLElement;
        setGeometry(viewport, { clientHeight: 100, scrollHeight: 400 });
        setGeometry(scrollbar, { clientHeight: 100 });
        setRect(scrollbar, { height: 100 });
        setRect(thumb, { bottom: 25, height: 25 });
        instance.value?.update();
        await flush();

        expect(scrollbar.tabIndex).toBe(-1);
        expect(scrollbar.getAttribute('aria-hidden')).toBe('true');

        const wheel = new WheelEvent('wheel', {
            bubbles: true,
            cancelable: true,
            deltaY: 40,
        });
        scrollbar.dispatchEvent(wheel);
        await flush();
        expect(wheel.defaultPrevented).toBe(true);
        expect(viewport.scrollTop).toBe(40);

        dispatchPointer(thumb, 'pointerdown', 10);
        dispatchPointer(window, 'pointermove', 35);
        await flush();
        expect(viewport.scrollTop).toBe(140);
        expect(document.activeElement).not.toBe(scrollbar);

        dispatchPointer(window, 'pointerup', 35);
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
        const contentOnKeydown = vi.fn();
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
            contentAttrs: {
                class: 'content-compatibility',
                'data-testid': 'content',
                role: 'group',
                onKeydown: contentOnKeydown,
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
        expect(content.classList.contains('content-compatibility')).toBe(true);
        expect(content.dataset.testid).toBe('content');
        expect(content.getAttribute('role')).toBe('group');
        expect(content.style.padding).toBe('12px');
        content.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' }));
        expect(contentOnKeydown).toHaveBeenCalledOnce();
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
