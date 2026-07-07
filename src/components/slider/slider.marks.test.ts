import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import Slider from './slider.vue';

describe('Slider marks', () => {
    it('renders slider marks from slider values', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 40,
                        min: 10,
                        max: 90,
                        marks: [20, { value: 40, label: '40%' }, { value: 80, label: '80%' }],
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-slider')!;
        const marks = [...container.querySelectorAll('.rp-slider__mark')] as HTMLElement[];
        const labels = [...container.querySelectorAll('.rp-slider__mark-label')];

        expect(root.classList.contains('rp-slider--marked')).toBe(true);
        expect(root.classList.contains('rp-slider--marks-with-labels')).toBe(true);
        expect(marks).toHaveLength(3);
        expect(marks[0].style.getPropertyValue('--_rp-slider-mark-position')).toBe('12.5%');
        expect(marks[1].style.getPropertyValue('--_rp-slider-mark-position')).toBe('37.5%');
        expect(marks[2].style.getPropertyValue('--_rp-slider-mark-position')).toBe('87.5%');
        expect(marks[0].classList.contains('rp-slider__mark--filled')).toBe(true);
        expect(marks[1].classList.contains('rp-slider__mark--filled')).toBe(true);
        expect(marks[2].classList.contains('rp-slider__mark--filled')).toBe(false);
        expect(labels.map((label) => label.textContent?.trim())).toEqual(['40%', '80%']);
    });

    it('supports hidden and colored slider marks', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 60,
                        marks: [
                            { value: 20, label: 'Hidden', hidden: true },
                            { value: 40, label: 'Warning', color: 'warning' },
                            { value: 80, label: 'Custom', color: '#ff3366' },
                        ],
                    });
                },
            }),
        );

        await flush();

        const marks = [...container.querySelectorAll('.rp-slider__mark')] as HTMLElement[];
        const labels = [...container.querySelectorAll('.rp-slider__mark-label')];

        expect(marks).toHaveLength(2);
        expect(labels.map((label) => label.textContent?.trim())).toEqual(['Warning', 'Custom']);
        expect(marks[0].style.getPropertyValue('--_rp-slider-mark-position')).toBe('40%');
        expect(marks[0].style.getPropertyValue('--_rp-slider-mark-color')).toBe(
            'var(--rp-color-warning)',
        );
        expect(marks[0].style.getPropertyValue('--_rp-slider-mark-label-color')).toBe(
            'var(--rp-color-warning)',
        );
        expect(marks[0].style.getPropertyValue('--_rp-slider-mark-filled-label-color')).toBe(
            'var(--rp-color-warning)',
        );
        expect(marks[0].style.getPropertyValue('--_rp-slider-mark-ring-color')).toBe(
            'var(--rp-color-warning)',
        );
        expect(marks[1].style.getPropertyValue('--_rp-slider-mark-position')).toBe('80%');
        expect(marks[1].style.getPropertyValue('--_rp-slider-mark-color')).toBe('#ff3366');
    });
});
