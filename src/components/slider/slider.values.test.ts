import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import Slider from './slider.vue';

describe('Slider values', () => {
    it('snaps the visible value and filled track to the configured step', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        ariaLabel: 'Test slider',
                        modelValue: 44,
                        min: 0,
                        max: 100,
                        step: 25,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-slider') as HTMLElement;
        const native = container.querySelector('input') as HTMLInputElement;

        expect(native.value).toBe('50');
        expect(root.style.getPropertyValue('--_rp-slider-percent')).toBe('50%');
    });

    it('keeps arbitrary values when step is any', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        ariaLabel: 'Test slider',
                        modelValue: 44,
                        min: 0,
                        max: 100,
                        step: 'any',
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-slider') as HTMLElement;
        const native = container.querySelector('input') as HTMLInputElement;

        expect(native.value).toBe('44');
        expect(root.style.getPropertyValue('--_rp-slider-percent')).toBe('44%');
    });

    it('normalizes inverted bounds and invalid steps before passing them to the native input', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        ariaLabel: 'Test slider',
                        modelValue: 75,
                        min: 100,
                        max: 0,
                        step: 0,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-slider') as HTMLElement;
        const native = container.querySelector('input') as HTMLInputElement;

        expect(native.min).toBe('0');
        expect(native.max).toBe('100');
        expect(native.step).toBe('any');
        expect(native.value).toBe('75');
        expect(root.style.getPropertyValue('--_rp-slider-percent')).toBe('75%');
    });
});
