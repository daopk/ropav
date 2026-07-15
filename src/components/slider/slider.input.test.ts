import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';

import { flush, input, mountDom } from '../../../tests/utils/vue';
import Slider from './slider.vue';

describe('Slider input', () => {
    it('emits numeric model updates from native range input events', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        modelValue: 20,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        const native = container.querySelector('input') as HTMLInputElement;
        input(native, '42');
        await flush();

        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onUpdate).toHaveBeenCalledWith(42);
    });

    it('does not emit updates when disabled', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        disabled: true,
                        modelValue: 20,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        const native = container.querySelector('input') as HTMLInputElement;
        input(native, '42');
        await flush();

        expect(native.disabled).toBe(true);
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it('applies range, state, and ARIA props', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        id: 'volume-control',
                        name: 'volume',
                        describedby: 'volume-help volume-error',
                        labelledby: 'volume-label',
                        modelValue: 35,
                        min: 10,
                        max: 90,
                        step: 5,
                        ariaValueText: '35 percent',
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-slider')!;
        const native = container.querySelector('input') as HTMLInputElement;

        expect(root).toBeTruthy();
        expect(native.id).toBe('volume-control');
        expect(native.name).toBe('volume');
        expect(native.value).toBe('35');
        expect(native.min).toBe('10');
        expect(native.max).toBe('90');
        expect(native.step).toBe('5');
        expect(native.getAttribute('aria-valuetext')).toBe('35 percent');
        expect(native.getAttribute('aria-labelledby')).toBe('volume-label');
        expect(native.getAttribute('aria-describedby')).toBe('volume-help volume-error');
    });

    it('forwards native attrs/events and exposes the native range input', async () => {
        const calls: string[] = [];
        const onChange = vi.fn();
        const sliderRef = ref<{
            nativeElement: HTMLInputElement | null;
            focus: (options?: FocusOptions) => void;
        } | null>(null);
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Slider, {
                        ref: sliderRef,
                        id: 'owned-id',
                        inputAttrs: {
                            id: 'ignored-id',
                            type: 'text',
                            value: 99,
                            min: -100,
                            max: 100,
                            step: 10,
                            disabled: true,
                            autocomplete: 'off',
                            class: 'native-class',
                            form: 'volume-form',
                            onChange,
                            onInput: () => calls.push('native-input'),
                        },
                        max: 50,
                        min: 10,
                        modelValue: 20,
                        step: 5,
                        'onUpdate:modelValue': () => calls.push('update'),
                    });
                },
            }),
        );

        await flush();

        const native = container.querySelector('input') as HTMLInputElement;
        expect(native.id).toBe('owned-id');
        expect(native.type).toBe('range');
        expect(native.value).toBe('20');
        expect(native.min).toBe('10');
        expect(native.max).toBe('50');
        expect(native.step).toBe('5');
        expect(native.disabled).toBe(false);
        expect(native.getAttribute('autocomplete')).toBe('off');
        expect(native.getAttribute('form')).toBe('volume-form');
        expect(native.classList.contains('native-class')).toBe(true);
        expect(sliderRef.value?.nativeElement).toBe(native);

        sliderRef.value?.focus({ preventScroll: true });
        expect(document.activeElement).toBe(native);

        input(native, '35');
        native.dispatchEvent(new Event('change', { bubbles: true }));
        await flush();

        expect(calls).toEqual(['update', 'native-input']);
        expect(onChange).toHaveBeenCalledOnce();
        expect(onChange.mock.calls[0]?.[0].target).toBe(native);
    });
});
