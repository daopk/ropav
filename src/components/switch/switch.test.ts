import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import Switch from './switch.vue';

describe('Switch', () => {
    it('emits model updates from native switch changes', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Switch,
                        {
                            modelValue: false,
                            'onUpdate:modelValue': onUpdate,
                        },
                        { default: () => 'Enable alerts' },
                    );
                },
            }),
        );

        const native = container.querySelector('input') as HTMLInputElement;
        expect(native.getAttribute('role')).toBe('switch');
        expect(native.getAttribute('aria-checked')).toBe('false');

        native.click();
        await flush();

        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onUpdate).toHaveBeenCalledWith(true);
    });

    it('does not emit updates when disabled', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Switch,
                        {
                            disabled: true,
                            modelValue: false,
                            'onUpdate:modelValue': onUpdate,
                        },
                        { default: () => 'Disabled' },
                    );
                },
            }),
        );

        const root = container.querySelector('.rp-switch')!;
        const native = container.querySelector('input') as HTMLInputElement;

        native.click();
        await flush();

        expect(native.disabled).toBe(true);
        expect(root.classList.contains('rp-switch--disabled')).toBe(true);
        expect(root.getAttribute('data-disabled')).toBe('true');
        expect(onUpdate).not.toHaveBeenCalled();
    });

    it('renders checked state', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Switch,
                        {
                            modelValue: true,
                        },
                        { default: () => 'Enabled' },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-switch')!;
        const native = container.querySelector('input') as HTMLInputElement;

        expect(root.classList.contains('rp-switch--checked')).toBe(true);
        expect(root.getAttribute('data-state')).toBe('checked');
        expect(native.checked).toBe(true);
        expect(native.getAttribute('aria-checked')).toBe('true');
    });

    it('applies direct state and ARIA props', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Switch,
                        {
                            id: 'notifications-control',
                            invalid: true,
                            labelledby: 'notifications-label',
                            describedby: 'notifications-description notifications-message',
                            modelValue: false,
                            required: true,
                        },
                        { default: () => 'Email notifications' },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-switch')!;
        const native = container.querySelector('input') as HTMLInputElement;

        expect(native.id).toBe('notifications-control');
        expect(native.required).toBe(true);
        expect(native.getAttribute('aria-required')).toBe('true');
        expect(native.getAttribute('aria-invalid')).toBe('true');
        expect(native.getAttribute('aria-labelledby')).toBe('notifications-label');
        expect(native.getAttribute('aria-describedby')).toBe(
            'notifications-description notifications-message',
        );
        expect(root.classList.contains('rp-switch--invalid')).toBe(true);
    });
});
