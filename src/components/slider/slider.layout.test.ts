import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import Slider from './slider.vue';

describe('Slider layout', () => {
    it('renders label and value slots around the native input', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Slider,
                        {
                            modelValue: 64,
                        },
                        {
                            default: () => 'Volume',
                            value: ({ value }: { value: number }) =>
                                h('span', { class: 'value' }, `${value}%`),
                        },
                    );
                },
            }),
        );

        await flush();

        const header = container.querySelector('.rp-slider__header')!;
        const label = container.querySelector('.rp-slider__label')!;
        const value = container.querySelector('.rp-slider__value .value')!;
        const native = container.querySelector('input') as HTMLInputElement;

        expect(header.contains(label)).toBe(true);
        expect(label.textContent).toBe('Volume');
        expect(value.parentElement?.getAttribute('aria-hidden')).toBe('true');
        expect(value.textContent).toBe('64%');
        expect(native.value).toBe('64');
    });

    it('sets custom properties for thumb and filled track positions', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 50,
                        min: 0,
                        max: 200,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-slider') as HTMLElement;
        const bar = container.querySelector('.rp-slider__bar') as HTMLElement;

        expect(bar.getAttribute('aria-hidden')).toBe('true');
        expect(root.style.getPropertyValue('--_rp-slider-percent')).toBe('25%');
        expect(root.style.getPropertyValue('--_rp-slider-ratio')).toBe('0.25');
    });

    it('adds native and ARIA orientation attributes for vertical sliders', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 50,
                        orientation: 'vertical',
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-slider') as HTMLElement;
        const native = container.querySelector('input') as HTMLInputElement;
        const tooltip = container.querySelector('.rp-slider__tooltip') as HTMLElement;

        expect([...root.classList]).toEqual(['rp-slider', 'rp-slider--vertical']);
        expect(native.getAttribute('orient')).toBe('vertical');
        expect(native.getAttribute('aria-orientation')).toBe('vertical');
        expect(root.style.getPropertyValue('--_rp-slider-percent')).toBe('50%');
        expect(tooltip.classList.contains('rp-tooltip--placement-left')).toBe(true);
    });

    it('sets custom thumb style properties from props', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 50,
                        thumbStyle: {
                            border: 2,
                            padding: 4,
                            size: 28,
                        },
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-slider') as HTMLElement;

        expect(root.style.getPropertyValue('--_rp-slider-thumb-size')).toBe('28px');
        expect(root.style.getPropertyValue('--_rp-slider-thumb-border-style')).toBe(
            '2px solid var(--_rp-slider-thumb-border)',
        );
        expect(root.style.getPropertyValue('--_rp-slider-thumb-padding')).toBe('4px');
    });

    it('renders a custom thumb slot with value and percent slot props', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Slider,
                        {
                            modelValue: 40,
                            formatValue: (value: number) => `${value}%`,
                            min: 0,
                            max: 200,
                        },
                        {
                            thumb: ({
                                formattedValue,
                                percent,
                            }: {
                                formattedValue: string;
                                percent: number;
                            }) =>
                                h(
                                    'span',
                                    { class: 'custom-thumb' },
                                    `${formattedValue}:${percent}`,
                                ),
                        },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-slider')!;
        const thumb = container.querySelector('.rp-slider__thumb')!;
        const content = container.querySelector('.rp-slider__thumb-content .custom-thumb')!;

        expect(root.classList.contains('rp-slider--custom-thumb')).toBe(true);
        expect(thumb.getAttribute('aria-hidden')).toBe('true');
        expect(content.textContent).toBe('40%:20');
    });
});
