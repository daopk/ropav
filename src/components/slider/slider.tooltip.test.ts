import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { flush, mountDom, queryDom } from '../../../tests/utils/vue';
import Slider from './slider.vue';

describe('Slider tooltip', () => {
    afterEach(() => {
        vi.useRealTimers();
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

        track.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
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

        track.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
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
