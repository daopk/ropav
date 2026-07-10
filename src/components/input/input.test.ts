import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive } from 'vue';

import { flush, input, mountDom } from '../../../tests/utils/vue';
import Input from './input.vue';

describe('Input', () => {
    const radii = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

    it('emits raw string values from native input events', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Input, {
                        type: 'number',
                        modelValue: '',
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        const native = container.querySelector('input') as HTMLInputElement;
        input(native, '');
        await nextTick();
        expect(onUpdate).toHaveBeenLastCalledWith('');

        input(native, '12');
        await nextTick();
        expect(onUpdate).toHaveBeenLastCalledWith('12');
    });

    it('applies direct state and ARIA props', async () => {
        const container = mountDom(
            defineComponent({
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
            }),
        );

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

    it('forwards native attributes and events without overriding owned props', async () => {
        const onBlur = vi.fn();
        const onChange = vi.fn();
        const onInput = vi.fn();
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Input, {
                        id: 'owned-id',
                        modelValue: '#123456',
                        inputAttrs: {
                            id: 'ignored-id',
                            value: 'ignored-value',
                            autocomplete: 'off',
                            inputmode: 'text',
                            pattern: '#[0-9a-fA-F]{6}',
                            form: 'color-form',
                            class: 'native-class',
                            onBlur,
                            onChange,
                            onInput,
                        },
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        const native = container.querySelector('input') as HTMLInputElement;

        expect(native.id).toBe('owned-id');
        expect(native.value).toBe('#123456');
        expect(native.getAttribute('autocomplete')).toBe('off');
        expect(native.getAttribute('inputmode')).toBe('text');
        expect(native.getAttribute('pattern')).toBe('#[0-9a-fA-F]{6}');
        expect(native.getAttribute('form')).toBe('color-form');
        expect(native.classList.contains('rp-input__native')).toBe(true);
        expect(native.classList.contains('native-class')).toBe(true);

        native.dispatchEvent(new FocusEvent('blur'));
        native.dispatchEvent(new Event('change'));
        input(native, '#abcdef');
        await flush();

        expect(onBlur).toHaveBeenCalledOnce();
        expect(onChange).toHaveBeenCalledOnce();
        expect(onInput).toHaveBeenCalledOnce();
        expect(onUpdate).toHaveBeenCalledWith('#abcdef');
    });

    it('applies and clears a custom validation message', async () => {
        const props = reactive({
            modelValue: 'invalid',
            validationMessage: 'Enter a valid value.',
        });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Input, props);
                },
            }),
        );

        await flush();

        const native = container.querySelector('input') as HTMLInputElement;
        expect(native.validationMessage).toBe('Enter a valid value.');
        expect(native.checkValidity()).toBe(false);

        props.validationMessage = '';
        await flush();

        expect(native.validationMessage).toBe('');
        expect(native.checkValidity()).toBe(true);
    });

    it('renders left and right slots around the native input', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Input,
                        {
                            modelValue: 'Search',
                        },
                        {
                            left: () => h('span', { class: 'left-icon' }, 'L'),
                            right: () => h('span', { class: 'right-icon' }, 'R'),
                        },
                    );
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-input')!;
        const native = container.querySelector('input') as HTMLInputElement;
        const left = container.querySelector('.rp-input__left .left-icon')!;
        const right = container.querySelector('.rp-input__right .right-icon')!;

        expect(root.children[0]).toBe(left.parentElement);
        expect(root.children[1]).toBe(native);
        expect(root.children[2]).toBe(right.parentElement);
        expect(native.value).toBe('Search');
    });

    it('applies valid state without ARIA invalid', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Input, {
                        modelValue: 'zoi@example.com',
                        valid: true,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-input')!;
        const native = container.querySelector('input') as HTMLInputElement;

        expect(root.classList.contains('rp-input--valid')).toBe(true);
        expect(root.classList.contains('rp-input--invalid')).toBe(false);
        expect(native.hasAttribute('aria-invalid')).toBe(false);
    });

    it('lets invalid state take priority over valid state', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Input, {
                        invalid: true,
                        modelValue: 'zoi@example.com',
                        valid: true,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-input')!;
        const native = container.querySelector('input') as HTMLInputElement;

        expect(root.classList.contains('rp-input--invalid')).toBe(true);
        expect(root.classList.contains('rp-input--valid')).toBe(false);
        expect(native.getAttribute('aria-invalid')).toBe('true');
    });

    it('focuses the native input when pressing the input padding', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Input, {
                        modelValue: '',
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-input')!;
        const native = container.querySelector('input') as HTMLInputElement;

        root.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        await flush();

        expect(document.activeElement).toBe(native);
    });

    it('keeps the native input focusable when the press starts inside the control', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Input, {
                        modelValue: '',
                    });
                },
            }),
        );

        await flush();

        const native = container.querySelector('input') as HTMLInputElement;

        native.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        await flush();

        expect(document.activeElement).toBe(native);
    });

    it('focuses the native input when pressing left and right slot chrome', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Input,
                        {
                            modelValue: '',
                        },
                        {
                            left: () => h('span', { class: 'left-icon' }, 'L'),
                            right: () => h('span', { class: 'right-icon' }, 'R'),
                        },
                    );
                },
            }),
        );

        await flush();

        const native = container.querySelector('input') as HTMLInputElement;
        const left = container.querySelector('.left-icon')!;
        const right = container.querySelector('.right-icon')!;

        left.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        await flush();

        expect(document.activeElement).toBe(native);

        native.blur();

        right.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        await flush();

        expect(document.activeElement).toBe(native);
    });

    it('does not steal focus from interactive slot content', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        Input,
                        {
                            modelValue: '',
                        },
                        {
                            right: () => h('button', { class: 'right-action' }, 'Clear'),
                        },
                    );
                },
            }),
        );

        await flush();

        const native = container.querySelector('input') as HTMLInputElement;
        const action = container.querySelector('.right-action')!;

        action.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        await flush();

        expect(document.activeElement).not.toBe(native);
    });

    it('does not focus the native input from padding when disabled', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(Input, {
                        disabled: true,
                        modelValue: '',
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-input')!;
        const native = container.querySelector('input') as HTMLInputElement;

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
                        radii.map((radius) => h(Input, { modelValue: radius, radius })),
                    );
                },
            }),
        );

        await flush();

        const roots = [...container.querySelectorAll('.rp-input')];

        expect(roots).toHaveLength(radii.length);
        for (const [index, radius] of radii.entries()) {
            expect([...roots[index].classList]).toEqual(['rp-input', `rp-input--radius-${radius}`]);
        }
    });

    it('adds a size modifier for each supported size', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        'div',
                        sizes.map((size) => h(Input, { modelValue: size, size })),
                    );
                },
            }),
        );

        await flush();

        const roots = [...container.querySelectorAll('.rp-input')];

        expect(roots).toHaveLength(sizes.length);
        for (const [index, size] of sizes.entries()) {
            expect([...roots[index].classList]).toEqual(['rp-input', `rp-input--size-${size}`]);
        }
    });
});
