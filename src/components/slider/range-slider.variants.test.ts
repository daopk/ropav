import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { colors, sizes } from '../../../tests/fixtures/slider';
import { flush, mountDom } from '../../../tests/utils/vue';
import RangeSlider from './range-slider.vue';

describe('RangeSlider variants', () => {
    it('resolves final color variables for each supported color', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        colors.map((color) => h(RangeSlider, { color, modelValue: [25, 75] })),
                    );
                },
            }),
        );

        await flush();

        const sliders = [...container.querySelectorAll('.rp-range-slider')];

        expect(sliders).toHaveLength(colors.length);
        for (const [index, color] of colors.entries()) {
            expect(
                (sliders[index] as HTMLElement).style.getPropertyValue('--_rp-range-slider-color'),
            ).toBe(`var(--rp-color-${color}-filled)`);
        }
    });

    it('sets a final color variable for arbitrary color values', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        color: '#ff3366',
                        modelValue: [25, 75],
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-range-slider') as HTMLElement;

        expect(root.style.getPropertyValue('--_rp-range-slider-color')).toBe('#ff3366');
        expect(root.style.getPropertyValue('--_rp-range-slider-lower-percent')).toBe('25%');
        expect(root.style.getPropertyValue('--_rp-range-slider-upper-percent')).toBe('75%');
    });

    it('adds a size modifier for each supported size', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        sizes.map((size) => h(RangeSlider, { modelValue: [25, 75], size })),
                    );
                },
            }),
        );

        await flush();

        const sliders = [...container.querySelectorAll('.rp-range-slider')];

        expect(sliders).toHaveLength(sizes.length);
        for (const [index, size] of sizes.entries()) {
            expect(sliders[index].classList.contains(`rp-range-slider--size-${size}`)).toBe(true);
        }
    });

    it('applies disabled state modifier', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(RangeSlider, { disabled: true, modelValue: [25, 75] }),
                    ]);
                },
            }),
        );

        await flush();

        const sliders = [...container.querySelectorAll('.rp-range-slider')];

        expect(sliders[0].classList.contains('rp-range-slider--disabled')).toBe(true);
        expect(sliders[0].getAttribute('data-disabled')).toBe('true');
    });
});
