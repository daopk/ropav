import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import RangeSlider from './range-slider.vue';

describe('RangeSlider layout', () => {
    it('renders label and tuple value slots around the two native inputs', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        RangeSlider,
                        {
                            id: 'price',
                            modelValue: [20, 80],
                            formatValue: (value: number) => `$${value}`,
                        },
                        {
                            default: () => 'Price range',
                            value: ({
                                value,
                                formattedValue,
                                percent,
                            }: {
                                value: [number, number];
                                formattedValue: [string, string];
                                percent: [number, number];
                            }) =>
                                h(
                                    'span',
                                    { class: 'range-value' },
                                    `${value.join(':')}|${formattedValue.join(':')}|${percent.join(':')}`,
                                ),
                        },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-range-slider')!;
        const label = container.querySelector('.rp-range-slider__label')!;
        const value = container.querySelector('.rp-range-slider__value .range-value')!;

        expect(label.textContent).toBe('Price range');
        expect(label.id).toBe('price-label');
        expect(root.getAttribute('role')).toBe('group');
        expect(root.getAttribute('aria-labelledby')).toBe('price-label');
        expect(value.parentElement?.getAttribute('aria-hidden')).toBe('true');
        expect(value.textContent).toBe('20:80|$20:$80|20:80');
    });

    it('renders the selected bar between lower and upper positions', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [50, 150],
                        min: 0,
                        max: 200,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-range-slider') as HTMLElement;
        const bar = container.querySelector('.rp-range-slider__bar')!;

        expect(bar.getAttribute('aria-hidden')).toBe('true');
        expect(root.style.getPropertyValue('--_rp-range-slider-lower-percent')).toBe('25%');
        expect(root.style.getPropertyValue('--_rp-range-slider-upper-percent')).toBe('75%');
        expect(root.style.getPropertyValue('--_rp-range-slider-lower-ratio')).toBe('0.25');
        expect(root.style.getPropertyValue('--_rp-range-slider-upper-ratio')).toBe('0.75');
    });

    it('adds native and ARIA orientation attributes for vertical sliders', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [25, 75],
                        orientation: 'vertical',
                        tooltip: 'always',
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-range-slider') as HTMLElement;
        const inputs = [...container.querySelectorAll<HTMLInputElement>('input')];
        const tooltips = [...container.querySelectorAll('.rp-range-slider__tooltip')];

        expect(root.classList.contains('rp-range-slider--vertical')).toBe(true);
        for (const native of inputs) {
            expect(native.getAttribute('orient')).toBe('vertical');
            expect(native.getAttribute('aria-orientation')).toBe('vertical');
        }
        expect(tooltips).toHaveLength(3);
        expect(
            tooltips.every((tooltip) => tooltip.classList.contains('rp-tooltip--placement-left')),
        ).toBe(true);
    });

    it('sets custom thumb style properties from props', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [25, 75],
                        thumb: {
                            border: '2px solid red',
                            padding: 4,
                            size: 28,
                        },
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-range-slider') as HTMLElement;

        expect(root.style.getPropertyValue('--rp-slider-thumb-size')).toBe('28px');
        expect(root.style.getPropertyValue('--_rp-range-slider-thumb-border-style')).toBe(
            '2px solid red',
        );
        expect(root.style.getPropertyValue('--rp-slider-thumb-padding')).toBe('4px');
    });

    it('renders the custom thumb slot twice with endpoint-specific slot props', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        RangeSlider,
                        {
                            modelValue: [40, 160],
                            formatValue: (value: number) => `${value}px`,
                            min: 0,
                            max: 200,
                        },
                        {
                            thumb: ({
                                thumb,
                                index,
                                value,
                                formattedValue,
                                percent,
                            }: {
                                thumb: 'lower' | 'upper';
                                index: number;
                                value: number;
                                formattedValue: string;
                                percent: number;
                            }) =>
                                h(
                                    'span',
                                    { class: `custom-thumb custom-thumb--${thumb}` },
                                    `${index}:${value}:${formattedValue}:${percent}`,
                                ),
                        },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-range-slider')!;
        const thumbs = [...container.querySelectorAll('.rp-range-slider__thumb')];
        const custom = [...container.querySelectorAll('.custom-thumb')];

        expect(root.classList.contains('rp-range-slider--custom-thumb')).toBe(true);
        expect(thumbs).toHaveLength(2);
        expect(
            thumbs.every((thumb) => thumb.parentElement?.getAttribute('aria-hidden') === 'true'),
        ).toBe(true);
        expect(custom.map((thumb) => thumb.textContent)).toEqual([
            '0:40:40px:20',
            '1:160:160px:80',
        ]);
    });
});
