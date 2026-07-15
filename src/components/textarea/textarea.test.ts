import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';

import { flush, mountDom } from '../../../tests/utils/vue';
import Textarea from './textarea.vue';

function typeTextarea(el: HTMLTextAreaElement, value: string) {
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
}

function mockTextareaMetrics() {
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
        () =>
            ({
                lineHeight: '20px',
                fontSize: '16px',
                paddingTop: '4px',
                paddingBottom: '4px',
                borderTopWidth: '0px',
                borderBottomWidth: '0px',
            }) as CSSStyleDeclaration,
    );
}

describe('Textarea', () => {
    const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    const resizes = ['vertical', 'both'] as const;
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

    afterEach(() => {
        vi.restoreAllMocks();
    });

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
                        readonly: true,
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
        expect(native.readOnly).toBe(true);
        expect(native.required).toBe(true);
        expect(native.getAttribute('aria-required')).toBe('true');
        expect(native.getAttribute('aria-invalid')).toBe('true');
        expect(native.getAttribute('aria-labelledby')).toBe('bio-label');
        expect(native.getAttribute('aria-describedby')).toBe(
            'external-help bio-description bio-message',
        );
        expect(root.classList.contains('rp-textarea--disabled')).toBe(true);
        expect(root.classList.contains('rp-textarea--invalid')).toBe(true);
        expect(root.classList.contains('rp-textarea--readonly')).toBe(true);
    });

    it('forwards native attrs and exposes focus without overriding owned props', async () => {
        const calls: string[] = [];
        const textareaRef = ref<{
            nativeElement: HTMLTextAreaElement | null;
            focus: (options?: FocusOptions) => void;
        } | null>(null);
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Textarea, {
                        ref: textareaRef,
                        id: 'owned-id',
                        inputAttrs: {
                            id: 'ignored-id',
                            value: 'ignored-value',
                            rows: 12,
                            disabled: true,
                            autocomplete: 'off',
                            class: 'native-class',
                            form: 'notes-form',
                            maxlength: 120,
                            onInput: () => calls.push('native'),
                        },
                        modelValue: 'Owned value',
                        rows: 4,
                        'onUpdate:modelValue': () => calls.push('update'),
                    });
                },
            }),
        );

        await flush();

        const native = container.querySelector('textarea') as HTMLTextAreaElement;
        expect(native.id).toBe('owned-id');
        expect(native.value).toBe('Owned value');
        expect(native.rows).toBe(4);
        expect(native.disabled).toBe(false);
        expect(native.getAttribute('autocomplete')).toBe('off');
        expect(native.getAttribute('form')).toBe('notes-form');
        expect(native.maxLength).toBe(120);
        expect(native.classList.contains('native-class')).toBe(true);
        expect(textareaRef.value?.nativeElement).toBe(native);

        textareaRef.value?.focus({ preventScroll: true });
        expect(document.activeElement).toBe(native);

        typeTextarea(native, 'Updated value');
        await flush();

        expect(calls).toEqual(['update', 'native']);
    });

    it('applies valid state without ARIA invalid', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Textarea, {
                        modelValue: 'Ready',
                        valid: true,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-textarea')!;
        const native = container.querySelector('textarea') as HTMLTextAreaElement;

        expect(root.classList.contains('rp-textarea--valid')).toBe(true);
        expect(root.classList.contains('rp-textarea--invalid')).toBe(false);
        expect(native.hasAttribute('aria-invalid')).toBe(false);
    });

    it('lets invalid state take priority over valid state', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Textarea, {
                        invalid: true,
                        modelValue: 'Needs work',
                        valid: true,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-textarea')!;
        const native = container.querySelector('textarea') as HTMLTextAreaElement;

        expect(root.classList.contains('rp-textarea--invalid')).toBe(true);
        expect(root.classList.contains('rp-textarea--valid')).toBe(false);
        expect(native.getAttribute('aria-invalid')).toBe('true');
    });

    it('focuses the native textarea when pressing the textarea padding', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Textarea, {
                        modelValue: '',
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-textarea')!;
        const native = container.querySelector('textarea') as HTMLTextAreaElement;

        root.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        await flush();

        expect(document.activeElement).toBe(native);
    });

    it('does not focus the native textarea from padding when disabled', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Textarea, {
                        disabled: true,
                        modelValue: '',
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-textarea')!;
        const native = container.querySelector('textarea') as HTMLTextAreaElement;

        root.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        await flush();

        expect(document.activeElement).not.toBe(native);
    });

    it('adds a radius modifier for each supported radius', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        radii.map((radius) => h(Textarea, { modelValue: radius, radius })),
                    );
                },
            }),
        );

        await flush();

        const roots = [...container.querySelectorAll('.rp-textarea')];

        expect(roots).toHaveLength(radii.length);
        for (const [index, radius] of radii.entries()) {
            expect([...roots[index].classList]).toEqual([
                'rp-textarea',
                `rp-textarea--radius-${radius}`,
            ]);
        }
    });

    it('adds a size modifier for each supported size', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        sizes.map((size) => h(Textarea, { modelValue: size, size })),
                    );
                },
            }),
        );

        await flush();

        const roots = [...container.querySelectorAll('.rp-textarea')];

        expect(roots).toHaveLength(sizes.length);
        for (const [index, size] of sizes.entries()) {
            expect([...roots[index].classList]).toEqual([
                'rp-textarea',
                `rp-textarea--size-${size}`,
            ]);
        }
    });

    it('adds a resize modifier only when resize is enabled', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(Textarea, { modelValue: 'none' }),
                        ...resizes.map((resize) => h(Textarea, { modelValue: resize, resize })),
                    ]);
                },
            }),
        );

        await flush();

        const roots = [...container.querySelectorAll('.rp-textarea')];

        expect([...roots[0].classList]).toEqual(['rp-textarea']);
        for (const [index, resize] of resizes.entries()) {
            expect([...roots[index + 1].classList]).toEqual([
                'rp-textarea',
                `rp-textarea--resize-${resize}`,
            ]);
        }
    });

    it('autosizes between minRows and maxRows', async () => {
        mockTextareaMetrics();

        const container = mountDom(
            defineComponent({
                render() {
                    return h(Textarea, {
                        autosize: true,
                        maxRows: 3,
                        minRows: 2,
                        modelValue: '',
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-textarea')!;
        const native = container.querySelector('textarea') as HTMLTextAreaElement;
        let scrollHeight = 20;

        Object.defineProperty(native, 'scrollHeight', {
            configurable: true,
            get: () => scrollHeight,
        });

        typeTextarea(native, 'Short');
        await flush();

        expect(root.classList.contains('rp-textarea--autosize')).toBe(true);
        expect(native.rows).toBe(2);
        expect(native.style.height).toBe('48px');
        expect(native.style.overflowY).toBe('hidden');

        scrollHeight = 120;
        typeTextarea(native, 'Line 1\nLine 2\nLine 3\nLine 4');
        await flush();

        expect(native.style.height).toBe('68px');
        expect(native.style.overflowY).toBe('auto');
    });

    it('autosizes without a maxRows limit', async () => {
        mockTextareaMetrics();

        const container = mountDom(
            defineComponent({
                render() {
                    return h(Textarea, {
                        autosize: true,
                        minRows: 2,
                        modelValue: '',
                    });
                },
            }),
        );

        await flush();

        const native = container.querySelector('textarea') as HTMLTextAreaElement;
        let scrollHeight = 160;

        Object.defineProperty(native, 'scrollHeight', {
            configurable: true,
            get: () => scrollHeight,
        });

        typeTextarea(native, 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6');
        await flush();

        expect(native.rows).toBe(2);
        expect(native.style.height).toBe('160px');
        expect(native.style.overflowY).toBe('hidden');
    });

    it('measures autosize only once for a controlled input update', async () => {
        mockTextareaMetrics();

        const value = ref('');
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Textarea, {
                        autosize: true,
                        minRows: 1,
                        modelValue: value.value,
                        'onUpdate:modelValue': (nextValue: string) => {
                            value.value = nextValue;
                        },
                    });
                },
            }),
        );

        await flush();

        const native = container.querySelector('textarea') as HTMLTextAreaElement;
        const readScrollHeight = vi.fn(() => 48);
        Object.defineProperty(native, 'scrollHeight', {
            configurable: true,
            get: readScrollHeight,
        });
        vi.mocked(window.getComputedStyle).mockClear();

        typeTextarea(native, 'One update');
        await flush();

        expect(value.value).toBe('One update');
        expect(readScrollHeight).toHaveBeenCalledOnce();
        expect(window.getComputedStyle).toHaveBeenCalledOnce();
        expect(native.style.height).toBe('48px');
    });
});
