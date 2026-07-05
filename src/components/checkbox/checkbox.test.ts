import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import Checkbox from './checkbox.vue';

describe('Checkbox', () => {
    it('emits model updates from native checkbox changes', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(defineComponent({
            render() {
                return h(Checkbox, {
                    modelValue: false,
                    'onUpdate:modelValue': onUpdate,
                }, { default: () => 'Accept terms' });
            },
        }));

        const native = container.querySelector('input') as HTMLInputElement;
        native.click();
        await flush();

        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onUpdate).toHaveBeenCalledWith(true);
    });

    it('does not emit updates when disabled', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(defineComponent({
            render() {
                return h(Checkbox, {
                    disabled: true,
                    modelValue: false,
                    'onUpdate:modelValue': onUpdate,
                }, { default: () => 'Disabled' });
            },
        }));

        const native = container.querySelector('input') as HTMLInputElement;
        native.click();
        await flush();

        expect(native.disabled).toBe(true);
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it('renders indeterminate state with mixed aria state', async () => {
        const container = mountDom(defineComponent({
            render() {
                return h(Checkbox, {
                    indeterminate: true,
                    modelValue: false,
                }, { default: () => 'Select all' });
            },
        }));

        await flush();

        const root = container.querySelector('.rp-checkbox')!;
        const native = container.querySelector('input') as HTMLInputElement;

        expect(root.classList.contains('rp-checkbox--indeterminate')).toBe(true);
        expect(root.getAttribute('data-state')).toBe('indeterminate');
        expect(native.indeterminate).toBe(true);
        expect(native.getAttribute('aria-checked')).toBe('mixed');
    });

    it('applies direct state and ARIA props', async () => {
        const container = mountDom(defineComponent({
            render() {
                return h(Checkbox, {
                    id: 'terms-control',
                    invalid: true,
                    labelledby: 'terms-label',
                    describedby: 'terms-description terms-message',
                    modelValue: false,
                    required: true,
                }, { default: () => 'I agree' });
            },
        }));

        await flush();

        const root = container.querySelector('.rp-checkbox')!;
        const native = container.querySelector('input') as HTMLInputElement;

        expect(native.id).toBe('terms-control');
        expect(native.required).toBe(true);
        expect(native.getAttribute('aria-required')).toBe('true');
        expect(native.getAttribute('aria-invalid')).toBe('true');
        expect(native.getAttribute('aria-labelledby')).toBe('terms-label');
        expect(native.getAttribute('aria-describedby')).toBe('terms-description terms-message');
        expect(root.classList.contains('rp-checkbox--invalid')).toBe(true);
    });
});
