import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';

import { flush, input, mountDom } from '../../../tests/utils/vue';
import Input from './input.vue';

describe('Input', () => {
    it('emits raw string values from native input events', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(defineComponent({
            render() {
                return h(Input, {
                    type: 'number',
                    modelValue: '',
                    'onUpdate:modelValue': onUpdate,
                });
            },
        }));

        const native = container.querySelector('input') as HTMLInputElement;
        input(native, '');
        await nextTick();
        expect(onUpdate).toHaveBeenLastCalledWith('');

        input(native, '12');
        await nextTick();
        expect(onUpdate).toHaveBeenLastCalledWith('12');
    });

    it('applies direct state and ARIA props', async () => {
        const container = mountDom(defineComponent({
            render() {
                return h(Input, {
                    id: 'email-control',
                    describedby: 'email-help email-error',
                    disabled: true,
                    invalid: true,
                    labelledby: 'email-label',
                    modelValue: 'zoi@example.com',
                    readonly: true,
                    required: true,
                });
            },
        }));

        await flush();

        const root = container.querySelector('.rp-input')!;
        const native = container.querySelector('input') as HTMLInputElement;

        expect(native.id).toBe('email-control');
        expect(native.value).toBe('zoi@example.com');
        expect(native.disabled).toBe(true);
        expect(native.readOnly).toBe(true);
        expect(native.required).toBe(true);
        expect(native.getAttribute('aria-required')).toBe('true');
        expect(native.getAttribute('aria-invalid')).toBe('true');
        expect(native.getAttribute('aria-labelledby')).toBe('email-label');
        expect(native.getAttribute('aria-describedby')).toBe('email-help email-error');
        expect(root.classList.contains('rp-input--disabled')).toBe(true);
        expect(root.classList.contains('rp-input--invalid')).toBe(true);
        expect(root.classList.contains('rp-input--readonly')).toBe(true);
    });
});
