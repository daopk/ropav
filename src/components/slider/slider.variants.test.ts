import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { colors, sizes } from '../../../tests/fixtures/slider';
import { flush, mountDom } from '../../../tests/utils/vue';
import Slider from './slider.vue';

describe('Slider variants', () => {
    it('adds a color modifier for each supported color', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        colors.map((color) => h(Slider, { color, modelValue: 50 })),
                    );
                },
            }),
        );

        await flush();

        const sliders = [...container.querySelectorAll('.rp-slider')];

        expect(sliders).toHaveLength(colors.length);
        for (const [index, color] of colors.entries()) {
            expect([...sliders[index].classList]).toEqual([
                'rp-slider',
                `rp-slider--color-${color}`,
            ]);
            expect(
                (sliders[index] as HTMLElement).style.getPropertyValue('--_rp-slider-custom-color'),
            ).toBe('');
        }
    });

    it('sets an inline custom color for arbitrary color values', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        color: '#ff3366',
                        modelValue: 50,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-slider') as HTMLElement;

        expect([...root.classList]).toEqual(['rp-slider']);
        expect(root.style.getPropertyValue('--_rp-slider-custom-color')).toBe('#ff3366');
        expect(root.style.getPropertyValue('--_rp-slider-percent')).toBe('50%');
    });

    it('adds a size modifier for each supported size', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        sizes.map((size) => h(Slider, { modelValue: 50, size })),
                    );
                },
            }),
        );

        await flush();

        const sliders = [...container.querySelectorAll('.rp-slider')];

        expect(sliders).toHaveLength(sizes.length);
        for (const [index, size] of sizes.entries()) {
            expect([...sliders[index].classList]).toEqual(['rp-slider', `rp-slider--size-${size}`]);
        }
    });
});
