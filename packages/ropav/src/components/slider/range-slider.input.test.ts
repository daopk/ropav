import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';

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

    it('applies shared native attrs and exposes both native inputs', async () => {
        const calls: string[] = [];
        const onChange = vi.fn();
        const sliderRef = ref<{
            nativeElements: [HTMLInputElement | null, HTMLInputElement | null];
            focus: (options?: FocusOptions) => void;
        } | null>(null);
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        ref: sliderRef,
                        id: 'owned-range',
                        inputAttrs: {
                            id: 'ignored-id',
                            type: 'text',
                            value: 99,
                            min: -100,
                            max: 100,
                            step: 10,
                            disabled: true,
                            autocomplete: 'off',
                            class: 'shared-native-class',
                            form: 'range-form',
                            onChange,
                            onInput: () => calls.push('native-input'),
                        },
                        max: 90,
                        min: 10,
                        modelValue: [20, 80],
                        step: 5,
                        'onUpdate:modelValue': () => calls.push('update'),
                    });
                },
            }),
        );

        await flush();

        const [lower, upper] = getNativeInputs(container);
        expect(sliderRef.value?.nativeElements).toEqual([lower, upper]);
        expect(lower.id).toBe('owned-range');
        expect(upper.id).toBe('owned-range-upper');
        for (const [native, value] of [
            [lower, '20'],
            [upper, '80'],
        ] as const) {
            expect(native.type).toBe('range');
            expect(native.value).toBe(value);
            expect(native.min).toBe('10');
            expect(native.max).toBe('90');
            expect(native.step).toBe('5');
            expect(native.disabled).toBe(false);
            expect(native.getAttribute('autocomplete')).toBe('off');
            expect(native.getAttribute('form')).toBe('range-form');
            expect(native.classList.contains('shared-native-class')).toBe(true);
        }

        sliderRef.value?.focus({ preventScroll: true });
        expect(document.activeElement).toBe(lower);

        input(lower, '25');
        lower.dispatchEvent(new Event('change', { bubbles: true }));
        await flush();

        expect(calls).toEqual(['update', 'native-input']);
        expect(onChange).toHaveBeenCalledOnce();
        expect(onChange.mock.calls[0]?.[0].target).toBe(lower);
    });

    it('applies per-thumb native attrs and composes interaction handlers', async () => {
        const lowerFocus = vi.fn();
        const lowerKeydown = vi.fn();
        const upperBlur = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(RangeSlider, {
                        inputAttrs: [
                            {
                                class: 'lower-native-class',
                                title: 'Lower native input',
                                onFocus: lowerFocus,
                                onKeydown: lowerKeydown,
                            },
                            {
                                class: 'upper-native-class',
                                title: 'Upper native input',
                                onBlur: upperBlur,
                            },
                        ],
                        modelValue: [20, 80],
                    });
                },
            }),
        );

        await flush();

        const [lower, upper] = getNativeInputs(container);
        expect(lower.classList.contains('lower-native-class')).toBe(true);
        expect(lower.title).toBe('Lower native input');
        expect(upper.classList.contains('upper-native-class')).toBe(true);
        expect(upper.title).toBe('Upper native input');

        lower.focus();
        keydown(lower, 'A');
        upper.focus();
        upper.blur();
        await flush();

        expect(lowerFocus).toHaveBeenCalledOnce();
        expect(lowerKeydown).toHaveBeenCalledOnce();
        expect(upperBlur).toHaveBeenCalledOnce();
    });
});
