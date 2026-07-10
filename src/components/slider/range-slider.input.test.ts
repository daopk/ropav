import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, input, keydown, mountDom } from '../../../tests/utils/vue';
import RangeSlider from './range-slider.vue';

function getNativeInputs(container: Element) {
    return [...container.querySelectorAll<HTMLInputElement>('.rp-range-slider__native')];
}

describe('RangeSlider input', () => {
    it('clamps native input updates to minRange without moving the other thumb', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [20, 80],
                        minRange: 15,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        const [lower, upper] = getNativeInputs(container);

        input(lower, '70');
        await flush();
        expect(onUpdate).toHaveBeenLastCalledWith([65, 80]);

        input(upper, '10');
        await flush();
        expect(onUpdate).toHaveBeenLastCalledWith([20, 35]);
        expect(onUpdate).toHaveBeenCalledTimes(2);
    });

    it('sorts crossover updates and transfers focus to the new thumb role', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [20, 80],
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-range-slider')!;
        const [lower, upper] = getNativeInputs(container);

        lower.focus();
        input(lower, '80');
        await flush();
        expect(onUpdate).toHaveBeenLastCalledWith([80, 80]);
        expect(root.getAttribute('data-active-thumb')).toBe('lower');
        expect(document.activeElement).toBe(lower);

        input(lower, '90');
        await flush();
        expect(onUpdate).toHaveBeenLastCalledWith([80, 90]);
        expect(root.getAttribute('data-active-thumb')).toBe('upper');
        expect(document.activeElement).toBe(upper);

        input(upper, '10');
        await flush();
        expect(onUpdate).toHaveBeenLastCalledWith([10, 20]);
        expect(root.getAttribute('data-active-thumb')).toBe('lower');
        expect(document.activeElement).toBe(lower);
        expect(onUpdate).toHaveBeenCalledTimes(3);
    });

    it('handles the input event that browsers fire after range keyboard interaction', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [20, 80],
                        step: 5,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        const [lower] = getNativeInputs(container);

        lower.focus();
        keydown(lower, 'ArrowRight');
        input(lower, '25');
        await flush();

        expect(document.activeElement).toBe(lower);
        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onUpdate).toHaveBeenCalledWith([25, 80]);
    });

    it('keeps off-grid endpoints valid while manually applying crossover keys', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [20, 90],
                        min: 0,
                        max: 95,
                        step: 10,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-range-slider')!;
        const [lower, upper] = getNativeInputs(container);

        expect(lower.step).toBe('any');
        expect(upper.step).toBe('any');
        expect(lower.checkValidity()).toBe(true);
        expect(upper.checkValidity()).toBe(true);

        lower.focus();
        keydown(lower, 'ArrowRight');
        await flush();
        expect(onUpdate).toHaveBeenLastCalledWith([30, 90]);

        keydown(lower, 'Home');
        await flush();
        expect(onUpdate).toHaveBeenLastCalledWith([0, 90]);

        keydown(lower, 'End');
        await flush();
        expect(onUpdate).toHaveBeenLastCalledWith([90, 95]);
        expect(root.getAttribute('data-active-thumb')).toBe('upper');
        expect(document.activeElement).toBe(upper);

        upper.focus();
        keydown(upper, 'ArrowLeft');
        await flush();
        expect(onUpdate).toHaveBeenLastCalledWith([20, 80]);

        keydown(upper, 'Home');
        await flush();
        expect(onUpdate).toHaveBeenLastCalledWith([0, 20]);
        expect(root.getAttribute('data-active-thumb')).toBe('lower');
        expect(document.activeElement).toBe(lower);

        upper.focus();
        keydown(upper, 'End');
        await flush();
        expect(onUpdate).toHaveBeenLastCalledWith([20, 95]);
        expect(onUpdate).toHaveBeenCalledTimes(6);
    });

    it('does not emit updates when disabled', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        disabled: true,
                        modelValue: [20, 80],
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        const inputs = getNativeInputs(container);
        input(inputs[0], '40');
        input(inputs[1], '60');
        await flush();

        expect(inputs.every((native) => native.disabled)).toBe(true);
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it('uses full native bounds when minRange is zero', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [20, 80],
                        min: 10,
                        max: 90,
                        step: 5,
                    });
                },
            }),
        );

        await flush();

        const [lower, upper] = getNativeInputs(container);

        expect(lower.value).toBe('20');
        expect(lower.min).toBe('10');
        expect(lower.max).toBe('90');
        expect(upper.value).toBe('80');
        expect(upper.min).toBe('10');
        expect(upper.max).toBe('90');
        expect(
            lower.compareDocumentPosition(upper) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
        expect(lower.tabIndex).toBe(0);
        expect(upper.tabIndex).toBe(0);
    });

    it('sets dynamic native bounds when minRange is positive', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [20, 80],
                        min: 10,
                        max: 90,
                        step: 5,
                        minRange: 15,
                    });
                },
            }),
        );

        await flush();

        const [lower, upper] = getNativeInputs(container);

        expect(lower.value).toBe('20');
        expect(lower.min).toBe('10');
        expect(lower.max).toBe('65');
        expect(upper.value).toBe('80');
        expect(upper.min).toBe('35');
        expect(upper.max).toBe('90');
        expect(
            lower.compareDocumentPosition(upper) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
        expect(lower.tabIndex).toBe(0);
        expect(upper.tabIndex).toBe(0);
    });

    it('applies IDs, tuple names, state, labels, and per-thumb aria-valuetext', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        id: 'price-range',
                        name: ['minimum-price', 'maximum-price'],
                        describedby: 'price-help price-error',
                        labelledby: 'price-label',
                        modelValue: [20, 80],
                        required: true,
                        invalid: true,
                        ariaLabel: ['Minimum price', 'Maximum price'],
                        ariaValueText: [
                            '20 dollars minimum',
                            (value: number) => `${value} dollars maximum`,
                        ],
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-range-slider')!;
        const [lower, upper] = getNativeInputs(container);

        expect(root.classList.contains('rp-range-slider--invalid')).toBe(true);
        expect(root.getAttribute('aria-labelledby')).toBe('price-label');
        expect(lower.id).toBe('price-range');
        expect(upper.id).toBe('price-range-upper');
        expect(lower.name).toBe('minimum-price');
        expect(upper.name).toBe('maximum-price');
        expect(lower.getAttribute('aria-label')).toBe('Minimum price');
        expect(upper.getAttribute('aria-label')).toBe('Maximum price');
        expect(lower.getAttribute('aria-valuetext')).toBe('20 dollars minimum');
        expect(upper.getAttribute('aria-valuetext')).toBe('80 dollars maximum');

        for (const native of [lower, upper]) {
            expect(native.required).toBe(true);
            expect(native.getAttribute('aria-required')).toBe('true');
            expect(native.getAttribute('aria-invalid')).toBe('true');
            expect(native.getAttribute('aria-labelledby')).toBeNull();
            expect(native.getAttribute('aria-describedby')).toBe('price-help price-error');
        }
    });

    it('supports a shared name and aria-valuetext formatter with default thumb labels', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        modelValue: [20, 80],
                        name: 'price',
                        ariaValueText: (value: number) => `${value} dollars`,
                    });
                },
            }),
        );

        await flush();

        const [lower, upper] = getNativeInputs(container);

        expect(lower.name).toBe('price');
        expect(upper.name).toBe('price');
        expect(lower.getAttribute('aria-label')).toBe('Minimum');
        expect(upper.getAttribute('aria-label')).toBe('Maximum');
        expect(lower.getAttribute('aria-valuetext')).toBe('20 dollars');
        expect(upper.getAttribute('aria-valuetext')).toBe('80 dollars');
    });
});
