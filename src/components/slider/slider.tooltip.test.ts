import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { flush, mountDom, queryDom } from '../../../tests/utils/vue';
import Slider from './slider.vue';

function mockRect(element: Element, rect: Partial<DOMRect>) {
    return vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        bottom: 20,
        height: 20,
        left: 0,
        right: 100,
        top: 0,
        width: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
        ...rect,
    });
}

function dispatchPointer(
    target: EventTarget,
    type:
        | 'pointerdown'
        | 'pointerenter'
        | 'pointerleave'
        | 'pointermove'
        | 'pointerup'
        | 'pointercancel',
    {
        clientX = 0,
        clientY = 0,
        isPrimary = true,
        pointerId = 1,
    }: { clientX?: number; clientY?: number; isPrimary?: boolean; pointerId?: number } = {},
) {
    const event = new MouseEvent(type, {
        bubbles: true,
        button: 0,
        cancelable: true,
        clientX,
        clientY,
    });
    Object.defineProperties(event, {
        isPrimary: { value: isPrimary },
        pointerId: { value: pointerId },
    });
    target.dispatchEvent(event);
}

async function flushPointerUpdate() {
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    await flush();
}

describe('Slider tooltip', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('previews the snapped pointer value without updating the model', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Slider,
                        {
                            formatValue: (value: number) => `${value}s`,
                            max: 100,
                            min: 0,
                            modelValue: 10,
                            step: 25,
                            tooltip: { anchor: 'pointer' },
                            'onUpdate:modelValue': onUpdate,
                        },
                        {
                            'tooltip-content': ({
                                anchor,
                                formattedValue,
                                percent,
                            }: {
                                anchor: string;
                                formattedValue: string;
                                percent: number;
                            }) =>
                                h(
                                    'span',
                                    { class: 'pointer-preview' },
                                    `${anchor}:${formattedValue}:${percent}`,
                                ),
                        },
                    );
                },
            }),
        );

        await flush();

        const root = queryDom(container, '.rp-slider') as HTMLElement;
        const track = queryDom(container, '.rp-slider__track') as HTMLElement;
        const travel = queryDom(container, '.rp-slider__travel')!;
        const tooltip = queryDom(container, '.rp-slider__tooltip')!;
        mockRect(travel, { left: 10, right: 90, width: 80 });

        dispatchPointer(track, 'pointerenter');
        dispatchPointer(track, 'pointermove', { clientX: 49, clientY: 10 });
        await flushPointerUpdate();

        expect(tooltip.classList.contains('rp-tooltip--open')).toBe(true);
        expect(queryDom(container, '.pointer-preview')?.textContent).toBe('pointer:50s:50');
        expect(root.style.getPropertyValue('--_rp-slider-tooltip-percent')).toBe('50%');
        expect(root.style.getPropertyValue('--_rp-slider-tooltip-ratio')).toBe('0.5');
        expect(onUpdate).not.toHaveBeenCalled();

        dispatchPointer(track, 'pointermove', { clientX: -20, clientY: 10 });
        await flushPointerUpdate();
        expect(queryDom(container, '.pointer-preview')?.textContent).toBe('pointer:0s:0');

        dispatchPointer(track, 'pointermove', { clientX: 200, clientY: 10 });
        await flushPointerUpdate();
        expect(queryDom(container, '.pointer-preview')?.textContent).toBe('pointer:100s:100');

        dispatchPointer(track, 'pointerleave');
        await flush();
        expect(tooltip.classList.contains('rp-tooltip--open')).toBe(false);
        expect(queryDom(container, '.pointer-preview')?.textContent).toBe('pointer:100s:100');

        dispatchPointer(track, 'pointerenter', { clientX: 29, clientY: 10 });
        await flush();
        expect(tooltip.classList.contains('rp-tooltip--open')).toBe(true);
        expect(queryDom(container, '.pointer-preview')?.textContent).toBe('pointer:25s:25');

        dispatchPointer(track, 'pointerleave');
        await flush();

        const native = queryDom(container, 'input') as HTMLInputElement;
        native.focus();
        await flush();
        expect(native.getAttribute('aria-valuetext')).toBe('0s');
        expect(tooltip.classList.contains('rp-tooltip--open')).toBe(false);
    });

    it('maps vertical pointer previews from bottom to top', async () => {
        const container = mountDom(
            defineComponent({
                render: () =>
                    h(Slider, {
                        max: 100,
                        min: 0,
                        modelValue: 10,
                        orientation: 'vertical',
                        step: 5,
                        tooltip: { anchor: 'pointer' },
                    }),
            }),
        );

        await flush();

        const root = queryDom(container, '.rp-slider') as HTMLElement;
        const track = queryDom(container, '.rp-slider__track') as HTMLElement;
        const travel = queryDom(container, '.rp-slider__travel')!;
        mockRect(travel, { bottom: 110, height: 100, top: 10 });

        dispatchPointer(track, 'pointerenter');
        dispatchPointer(track, 'pointermove', { clientX: 10, clientY: 85 });
        await flushPointerUpdate();

        expect(queryDom(container, '.rp-tooltip__content')?.textContent).toBe('25');
        expect(root.style.getPropertyValue('--_rp-slider-tooltip-percent')).toBe('25%');
    });

    it('keeps pointer preview and thumb interaction active while dragging outside the track', async () => {
        const container = mountDom(
            defineComponent({
                render: () =>
                    h(Slider, {
                        max: 100,
                        min: 0,
                        modelValue: 20,
                        thumb: 'interaction',
                        tooltip: { anchor: 'pointer' },
                    }),
            }),
        );

        await flush();

        const root = queryDom(container, '.rp-slider')!;
        const track = queryDom(container, '.rp-slider__track') as HTMLElement;
        const travel = queryDom(container, '.rp-slider__travel')!;
        const tooltip = queryDom(container, '.rp-slider__tooltip')!;
        mockRect(travel, { left: 0, right: 100, width: 100 });

        dispatchPointer(track, 'pointerdown', { clientX: 30, clientY: 10, pointerId: 7 });
        await flush();
        expect(root.hasAttribute('data-dragging')).toBe(true);
        expect(tooltip.classList.contains('rp-tooltip--open')).toBe(true);

        dispatchPointer(track, 'pointerleave', { pointerId: 7 });
        dispatchPointer(window, 'pointermove', { clientX: 80, clientY: 10, pointerId: 7 });
        await flushPointerUpdate();

        expect(queryDom(container, '.rp-tooltip__content')?.textContent).toBe('80');
        expect(root.hasAttribute('data-dragging')).toBe(true);
        expect(tooltip.classList.contains('rp-tooltip--open')).toBe(true);

        dispatchPointer(window, 'pointerup', { clientX: 80, clientY: 10, pointerId: 7 });
        await flush();
        expect(root.hasAttribute('data-dragging')).toBe(false);
        expect(tooltip.classList.contains('rp-tooltip--open')).toBe(false);
    });

    it('does not preview or enter dragging state when disabled', async () => {
        const container = mountDom(
            defineComponent({
                render: () =>
                    h(Slider, {
                        disabled: true,
                        modelValue: 20,
                        thumb: 'interaction',
                        tooltip: { anchor: 'pointer' },
                    }),
            }),
        );

        await flush();

        const root = queryDom(container, '.rp-slider')!;
        const track = queryDom(container, '.rp-slider__track') as HTMLElement;
        const tooltip = queryDom(container, '.rp-slider__tooltip')!;
        mockRect(track, { left: 0, right: 100, width: 100 });

        dispatchPointer(track, 'pointerenter');
        dispatchPointer(track, 'pointermove', { clientX: 80 });
        dispatchPointer(track, 'pointerdown', { clientX: 80 });
        await flushPointerUpdate();

        expect(root.hasAttribute('data-track-hovered')).toBe(false);
        expect(root.hasAttribute('data-dragging')).toBe(false);
        expect(tooltip.classList.contains('rp-tooltip--open')).toBe(false);
    });

    it('renders the current normalized value in the thumb tooltip', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 44,
                        min: 0,
                        max: 100,
                        step: 25,
                    });
                },
            }),
        );

        await flush();

        const tooltip = queryDom(container, '.rp-slider__tooltip') as HTMLElement;
        const tooltipContent = queryDom(container, '.rp-tooltip__content') as HTMLElement;

        expect(tooltip.classList.contains('rp-tooltip')).toBe(true);
        expect(tooltip.classList.contains('rp-tooltip--placement-top')).toBe(true);
        expect(tooltip.classList.contains('rp-tooltip--arrow')).toBe(false);
        expect(tooltipContent.classList.contains('rp-slider__tooltip-content')).toBe(true);
        expect(tooltip.contains(tooltipContent)).toBe(false);
        expect(tooltipContent.getAttribute('role')).toBeNull();
        expect(tooltipContent.getAttribute('aria-hidden')).toBe('true');
        expect(tooltipContent.style.display).toBe('none');
        expect(tooltipContent.textContent).toBe('50');
    });

    it('supports custom thumb tooltip options', async () => {
        vi.useFakeTimers();

        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 44,
                        tooltip: {
                            id: 'volume-tooltip',
                            placement: 'bottom',
                            color: 'orange',
                            offset: { mainAxis: 12, crossAxis: -4 },
                            openDelay: 100,
                            arrow: true,
                        },
                    });
                },
            }),
        );

        await flush();

        const track = queryDom(container, '.rp-slider__track') as HTMLElement;
        const tooltip = queryDom(container, '.rp-slider__tooltip') as HTMLElement;
        const tooltipContent = queryDom(container, '.rp-tooltip__content') as HTMLElement;

        expect(tooltip.classList.contains('rp-tooltip')).toBe(true);
        expect(tooltip.classList.contains('rp-tooltip--placement-bottom')).toBe(true);
        expect(tooltip.classList.contains('rp-tooltip--arrow')).toBe(true);
        expect(tooltipContent.id).toBe('volume-tooltip');
        expect(tooltipContent.style.getPropertyValue('--_rp-tooltip-bg')).toBe(
            'var(--rp-color-orange-filled)',
        );
        expect(tooltipContent.style.getPropertyValue('--_rp-tooltip-fg')).toBe(
            'var(--rp-color-white)',
        );
        expect(tooltipContent.style.getPropertyValue('--_rp-tooltip-main-axis-offset')).toBe(
            '12px',
        );
        expect(tooltipContent.style.getPropertyValue('--_rp-tooltip-cross-axis-offset')).toBe(
            '-4px',
        );

        dispatchPointer(track, 'pointerenter');
        await flush();
        expect(tooltip.classList.contains('rp-tooltip--open')).toBe(false);

        vi.advanceTimersByTime(99);
        await flush();
        expect(tooltip.classList.contains('rp-tooltip--open')).toBe(false);

        vi.advanceTimersByTime(1);
        await flush();
        expect(tooltip.classList.contains('rp-tooltip--open')).toBe(true);
    });

    it('shows the tooltip for the duration of a touch drag', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 44,
                    });
                },
            }),
        );

        await flush();

        const track = queryDom(container, '.rp-slider__track') as HTMLElement;
        const tooltip = queryDom(container, '.rp-slider__tooltip') as HTMLElement;
        const pointerDown = new Event('pointerdown', { bubbles: true, cancelable: true });
        Object.defineProperties(pointerDown, {
            button: { value: 0 },
            isPrimary: { value: true },
            pointerId: { value: 7 },
            pointerType: { value: 'touch' },
        });

        track.dispatchEvent(pointerDown);
        await flush();
        expect(tooltip.classList.contains('rp-tooltip--open')).toBe(true);

        dispatchPointer(track, 'pointerleave', { pointerId: 7 });
        await flush();
        expect(tooltip.classList.contains('rp-tooltip--open')).toBe(true);

        const pointerUp = new Event('pointerup');
        Object.defineProperty(pointerUp, 'pointerId', { value: 7 });
        window.dispatchEvent(pointerUp);
        await flush();
        expect(tooltip.classList.contains('rp-tooltip--open')).toBe(false);
    });

    it('supports formatting the thumb tooltip value', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 44,
                        formatValue: (value: number) => `${value}%`,
                    });
                },
            }),
        );

        await flush();

        const native = queryDom(container, 'input') as HTMLInputElement;
        const tooltipContent = queryDom(container, '.rp-tooltip__content')!;

        expect(native.getAttribute('aria-valuetext')).toBe('44%');
        expect(tooltipContent.textContent).toBe('44%');
    });

    it('lets aria-valuetext override the display formatter', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 44,
                        ariaValueText: (value: number) => `${value} percent selected`,
                        formatValue: (value: number) => `${value}%`,
                    });
                },
            }),
        );

        await flush();

        const native = queryDom(container, 'input') as HTMLInputElement;
        const tooltipContent = queryDom(container, '.rp-tooltip__content')!;

        expect(native.getAttribute('aria-valuetext')).toBe('44 percent selected');
        expect(tooltipContent.textContent).toBe('44%');
    });

    it('does not render the thumb tooltip when disabled by prop', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 44,
                        tooltip: false,
                    });
                },
            }),
        );

        await flush();

        expect(queryDom(container, '.rp-slider__tooltip')).toBeNull();
    });

    it('supports always showing the thumb tooltip', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 44,
                        tooltip: 'always',
                    });
                },
            }),
        );

        await flush();

        const root = queryDom(container, '.rp-slider')!;
        const tooltip = queryDom(container, '.rp-slider__tooltip') as HTMLElement;
        const tooltipContent = queryDom(container, '.rp-tooltip__content')!;

        expect(root.classList.contains('rp-slider--tooltip-always-visible')).toBe(true);
        expect(tooltip.classList.contains('rp-tooltip--open')).toBe(true);
        expect(tooltipContent.textContent).toBe('44');
    });
});
