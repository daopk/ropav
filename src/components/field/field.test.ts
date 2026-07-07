import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import Input from '../input/input.vue';
import Select from '../select/select.vue';
import Field from './field.vue';
import type { FieldSlotProps } from './types';

describe('Field', () => {
    it('provides control props that connect label, description, and message ids', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Field,
                        {
                            id: 'email',
                            label: 'Email',
                            description: 'Use your work email.',
                            message: 'We will send a confirmation.',
                            required: true,
                        },
                        {
                            default: ({ controlProps }: FieldSlotProps) =>
                                h(Input, {
                                    ...controlProps,
                                    modelValue: '',
                                }),
                        },
                    );
                },
            }),
        );

        await flush();

        const label = container.querySelector('.rp-field__label') as HTMLLabelElement;
        const description = container.querySelector('.rp-field__description')!;
        const message = container.querySelector('.rp-field__message')!;
        const native = container.querySelector('input') as HTMLInputElement;

        expect(label.id).toBe('email-label');
        expect(label.htmlFor).toBe('email');
        expect(label.textContent).toBe('Email*');
        expect(description.id).toBe('email-description');
        expect(message.id).toBe('email-message');
        expect(native.id).toBe('email');
        expect(native.required).toBe(true);
        expect(native.getAttribute('aria-required')).toBe('true');
        expect(native.getAttribute('aria-labelledby')).toBe('email-label');
        expect(native.getAttribute('aria-describedby')).toBe('email-description email-message');
    });

    it('treats error text as invalid state and announces the message', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Field,
                        {
                            id: 'email',
                            error: 'Enter a valid email.',
                        },
                        {
                            default: ({ controlProps }: FieldSlotProps) =>
                                h(Input, {
                                    ...controlProps,
                                    modelValue: 'nope',
                                }),
                        },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-field')!;
        const message = container.querySelector('.rp-field__message')!;
        const native = container.querySelector('input') as HTMLInputElement;

        expect(root.classList.contains('rp-field--invalid')).toBe(true);
        expect(message.textContent).toBe('Enter a valid email.');
        expect(message.getAttribute('role')).toBe('alert');
        expect(native.getAttribute('aria-invalid')).toBe('true');
        expect(native.getAttribute('aria-describedby')).toBe('email-message');
    });

    it('passes disabled state to the control slot', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Field,
                        {
                            disabled: true,
                            id: 'name',
                            label: 'Name',
                        },
                        {
                            default: ({ controlProps }: FieldSlotProps) =>
                                h(Input, {
                                    ...controlProps,
                                    modelValue: '',
                                }),
                        },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-field')!;
        const native = container.querySelector('input') as HTMLInputElement;

        expect(root.classList.contains('rp-field--disabled')).toBe(true);
        expect(native.disabled).toBe(true);
    });

    it('renders custom label, description, and message slots', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Field,
                        {
                            id: 'username',
                        },
                        {
                            label: () => h('span', { class: 'custom-label' }, 'Username'),
                            description: () =>
                                h('span', { class: 'custom-description' }, 'Public handle'),
                            message: () => h('span', { class: 'custom-message' }, 'Available'),
                            default: ({ id, labelledby, describedby }: FieldSlotProps) =>
                                h(Input, {
                                    id,
                                    labelledby,
                                    describedby,
                                    modelValue: '',
                                }),
                        },
                    );
                },
            }),
        );

        await flush();

        const native = container.querySelector('input') as HTMLInputElement;

        expect(container.querySelector('.custom-label')?.textContent).toBe('Username');
        expect(container.querySelector('.custom-description')?.textContent).toBe('Public handle');
        expect(container.querySelector('.custom-message')?.textContent).toBe('Available');
        expect(native.getAttribute('aria-labelledby')).toBe('username-label');
        expect(native.getAttribute('aria-describedby')).toBe(
            'username-description username-message',
        );
    });

    it('focuses a custom control when pressing the label', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Field,
                        {
                            id: 'role',
                            label: 'Role',
                        },
                        {
                            default: ({ controlProps }: FieldSlotProps) =>
                                h(Select, {
                                    ...controlProps,
                                    modelValue: null,
                                    options: [{ label: 'Owner', value: 'owner' }],
                                }),
                        },
                    );
                },
            }),
        );

        await flush();

        const label = container.querySelector('.rp-field__label') as HTMLLabelElement;
        const trigger = container.querySelector('[role="combobox"]') as HTMLElement;

        label.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        await flush();

        expect(document.activeElement).toBe(trigger);
    });
});
