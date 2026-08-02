import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import RangeSlider from './range-slider.vue';

function getNativeInputs(container: Element) {
    return [...container.querySelectorAll<HTMLInputElement>('.rp-range-slider__native')];
}

describe('RangeSlider values', () => {
    it('sorts and snaps both values to the configured step', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [86, 14],
                        min: 0,
                        max: 100,
                        step: 25,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-range-slider') as HTMLElement;
        const inputs = getNativeInputs(container);

        expect(inputs).toHaveLength(2);
        expect(inputs.map((input) => input.value)).toEqual(['25', '75']);
        expect(root.style.getPropertyValue('--_rp-range-slider-lower-percent')).toBe('25%');
        expect(root.style.getPropertyValue('--_rp-range-slider-upper-percent')).toBe('75%');
        expect(root.style.getPropertyValue('--_rp-range-slider-lower-ratio')).toBe('0.25');
        expect(root.style.getPropertyValue('--_rp-range-slider-upper-ratio')).toBe('0.75');
    });

    it('keeps arbitrary sorted values when step is any', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [73.5, 12.25],
                        step: 'any',
                    });
                },
            }),
        );

        await flush();

        const inputs = getNativeInputs(container);

        expect(inputs.map((input) => input.value)).toEqual(['12.25', '73.5']);
    });

    it('normalizes inverted bounds and invalid steps for both inputs', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [75, 25],
                        min: 100,
                        max: 0,
                        step: 0,
                    });
                },
            }),
        );

        await flush();

        const inputs = getNativeInputs(container);

        expect(inputs.map((input) => input.value)).toEqual(['25', '75']);
        expect(inputs.map((input) => input.step)).toEqual(['any', 'any']);
        expect(inputs[0].min).toBe('0');
        expect(inputs[1].max).toBe('100');
    });

    it('enforces minRange after step snapping while preferring the lower value', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [40, 42],
                        min: 0,
                        max: 100,
                        step: 5,
                        minRange: 22,
                    });
                },
            }),
        );

        await flush();

        expect(getNativeInputs(container).map((input) => input.value)).toEqual(['40', '65']);
    });

    it('moves the lower value when the preferred minRange expansion reaches max', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [90, 95],
                        min: 0,
                        max: 100,
                        step: 5,
                        minRange: 20,
                    });
                },
            }),
        );

        await flush();

        expect(getNativeInputs(container).map((input) => input.value)).toEqual(['80', '100']);
    });

    it('clamps minRange to the domain and treats invalid values like Slider', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(RangeSlider, {
                            modelValue: [40, 60],
                            min: 10,
                            max: 90,
                            minRange: 1_000,
                        }),
                        h(RangeSlider, {
                            modelValue: [Number.NaN, Number.POSITIVE_INFINITY],
                            minRange: Number.NEGATIVE_INFINITY,
                        }),
                    ]);
                },
            }),
        );

        await flush();

        const sliders = [...container.querySelectorAll('.rp-range-slider')];

        expect(getNativeInputs(sliders[0]).map((input) => input.value)).toEqual(['10', '90']);
        expect(getNativeInputs(sliders[1]).map((input) => input.value)).toEqual(['0', '0']);
    });
});
