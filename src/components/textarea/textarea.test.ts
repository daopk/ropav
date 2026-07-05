import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import Textarea from './textarea.vue';

function typeTextarea(el: HTMLTextAreaElement, value: string) {
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
}

describe('Textarea', () => {
    it('emits string updates from native textarea input', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Textarea, {
                        modelValue: '',
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        const native = container.querySelector('textarea') as HTMLTextAreaElement;
        typeTextarea(native, 'Hello world');
        await flush();

        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onUpdate).toHaveBeenCalledWith('Hello world');
    });

    it('renders rows and readonly state', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Textarea, {
                        modelValue: 'Notes',
                        readonly: true,
                        rows: 6,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-textarea')!;
        const native = container.querySelector('textarea') as HTMLTextAreaElement;

        expect(native.value).toBe('Notes');
        expect(native.rows).toBe(6);
        expect(native.readOnly).toBe(true);
        expect(root.classList.contains('rp-textarea--readonly')).toBe(true);
    });

    it('applies direct state and ARIA props', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Textarea, {
                        id: 'bio-control',
                        disabled: true,
                        invalid: true,
                        labelledby: 'bio-label',
                        describedby: 'external-help bio-description bio-message',
                        modelValue: '',
                        required: true,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-textarea')!;
        const native = container.querySelector('textarea') as HTMLTextAreaElement;

        expect(native.id).toBe('bio-control');
        expect(native.disabled).toBe(true);
        expect(native.required).toBe(true);
        expect(native.getAttribute('aria-required')).toBe('true');
        expect(native.getAttribute('aria-invalid')).toBe('true');
        expect(native.getAttribute('aria-labelledby')).toBe('bio-label');
        expect(native.getAttribute('aria-describedby')).toBe(
            'external-help bio-description bio-message',
        );
        expect(root.classList.contains('rp-textarea--disabled')).toBe(true);
        expect(root.classList.contains('rp-textarea--invalid')).toBe(true);
    });
});
