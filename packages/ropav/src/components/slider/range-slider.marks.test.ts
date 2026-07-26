import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import RangeSlider from './range-slider.vue';

describe('RangeSlider marks', () => {
    it('fills only marks that fall inside the selected range', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [30, 70],
                        min: 10,
                        max: 90,
                        marks: [
                            20,
                            { value: 30, label: 'Lower' },
                            { value: 50, label: 'Middle' },
                            { value: 70, label: 'Upper' },
                            80,
                        ],
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-range-slider')!;
        const marks = [...container.querySelectorAll('.rp-range-slider__mark')] as HTMLElement[];
        const labels = [...container.querySelectorAll('.rp-range-slider__mark-label')];

        expect(root.classList.contains('rp-range-slider--marked')).toBe(true);
        expect(root.classList.contains('rp-range-slider--marks-with-labels')).toBe(true);
        expect(marks).toHaveLength(5);
        expect(
            marks.map((mark) => mark.style.getPropertyValue('--_rp-range-slider-mark-position')),
        ).toEqual(['12.5%', '25%', '50%', '75%', '87.5%']);
        expect(
            marks.map((mark) => mark.classList.contains('rp-range-slider__mark--filled')),
        ).toEqual([false, true, true, true, false]);
        expect(labels.map((label) => label.textContent?.trim())).toEqual([
            'Lower',
            'Middle',
            'Upper',
        ]);
    });

    it('supports hidden and colored marks', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [20, 80],
                        marks: [
                            { value: 20, label: 'Hidden', hidden: true },
                            { value: 40, label: 'Warning', color: 'orange' },
                            { value: 80, label: 'Custom', color: '#ff3366' },
                        ],
                    });
                },
            }),
        );

        await flush();

        const marks = [...container.querySelectorAll('.rp-range-slider__mark')] as HTMLElement[];
        const labels = [...container.querySelectorAll('.rp-range-slider__mark-label')];

        expect(marks).toHaveLength(2);
        expect(labels.map((label) => label.textContent?.trim())).toEqual(['Warning', 'Custom']);
        expect(marks[0].style.getPropertyValue('--_rp-range-slider-mark-position')).toBe('40%');
        expect(marks[0].style.getPropertyValue('--_rp-range-slider-mark-color')).toBe(
            'var(--rp-color-orange-filled)',
        );
        expect(marks[0].style.getPropertyValue('--_rp-range-slider-mark-label-color')).toBe(
            'var(--rp-color-orange-light-color)',
        );
        expect(marks[0].style.getPropertyValue('--_rp-range-slider-mark-filled-label-color')).toBe(
            'var(--rp-color-orange-light-color)',
        );
        expect(marks[0].style.getPropertyValue('--_rp-range-slider-mark-ring-color')).toBe(
            'var(--rp-color-orange-filled)',
        );
        expect(marks[1].style.getPropertyValue('--_rp-range-slider-mark-position')).toBe('80%');
        expect(marks[1].style.getPropertyValue('--_rp-range-slider-mark-color')).toBe('#ff3366');
    });
});
