import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { click, flush, input, keydown, mountDom, waitTransition } from '../../../tests/utils/vue';
import ColorInput from './color-input.vue';

describe('ColorInput', () => {
    it('renders an input and preview swatch without a picker trigger button', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorInput, {
                        id: 'brand-color',
                        modelValue: '#4992d1',
                        ariaLabel: 'Brand color',
                        popoverId: 'brand-color-picker',
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-color-input')!;
        const native = container.querySelector('input') as HTMLInputElement;
        const preview = container.querySelector('.rp-color-input__preview') as HTMLElement;
        const popover = container.querySelector('.rp-popover__content') as HTMLElement;

        expect(root.classList.contains('rp-popover')).toBe(true);
        expect(root.classList.contains('rp-popover--placement-bottom-start')).toBe(true);
        expect(native.id).toBe('brand-color');
        expect(native.value).toBe('#4992d1');
        expect(native.getAttribute('aria-label')).toBe('Brand color');
        expect(native.getAttribute('role')).toBe('combobox');
        expect(native.getAttribute('aria-controls')).toBe('brand-color-picker');
        expect(native.getAttribute('aria-expanded')).toBe('false');
        expect(native.getAttribute('aria-haspopup')).toBe('dialog');
        expect(container.querySelector('.rp-input__left .rp-color-input__preview')).toBe(preview);
        expect(preview.style.getPropertyValue('--_rp-color-swatch-color')).toBe('#4992d1');
        expect(container.querySelector('.rp-color-input__trigger')).toBeNull();
        expect(container.querySelector('.rp-input__right')).toBeNull();
        expect(popover.style.display).toBe('none');
    });

    it('applies the selected size to both the input and picker', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorInput, {
                        modelValue: '#4992d1',
                        size: 'lg',
                    });
                },
            }),
        );

        await flush();

        expect(container.querySelector('.rp-input--size-lg')).toBeTruthy();
        expect(container.querySelector('.rp-color-picker--size-lg')).toBeTruthy();
    });

    it('forwards native input attrs and events while preserving trigger semantics', async () => {
        const onBlur = vi.fn();
        const onClick = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorInput, {
                        modelValue: '#4992d1',
                        popoverId: 'native-attrs-picker',
                        inputAttrs: {
                            autocomplete: 'off',
                            inputmode: 'text',
                            spellcheck: false,
                            role: 'textbox',
                            'aria-controls': 'ignored-picker',
                            onBlur,
                            onClick,
                        },
                    });
                },
            }),
        );

        const native = container.querySelector('input') as HTMLInputElement;

        expect(native.getAttribute('autocomplete')).toBe('off');
        expect(native.getAttribute('inputmode')).toBe('text');
        expect(native.getAttribute('spellcheck')).toBe('false');
        expect(native.getAttribute('role')).toBe('combobox');
        expect(native.getAttribute('aria-controls')).toBe('native-attrs-picker');

        click(native);
        native.dispatchEvent(new FocusEvent('blur'));
        await flush();

        expect(onClick).toHaveBeenCalledOnce();
        expect(onBlur).toHaveBeenCalledOnce();
        expect(native.getAttribute('aria-expanded')).toBe('true');
    });

    it('does not open the picker from interactive custom preview content', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        ColorInput,
                        { modelValue: '#4992d1' },
                        { left: () => h('button', { class: 'preview-action' }, 'Preview action') },
                    );
                },
            }),
        );

        const button = container.querySelector('.preview-action') as HTMLButtonElement;
        const picker = container.querySelector('.rp-popover__content') as HTMLElement;

        button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        click(button);
        await flush();

        expect(picker.style.display).toBe('none');
    });

    it('can opt into native validity for non-empty invalid colors', async () => {
        const container = mountDom(
            defineComponent({
                data: () => ({ color: 'not-a-color' }),
                render() {
                    return h(ColorInput, {
                        modelValue: this.color,
                        validateColor: true,
                        invalidColorMessage: 'Use a supported CSS color.',
                        'onUpdate:modelValue': (value) => {
                            this.color = value;
                        },
                    });
                },
            }),
        );

        await flush();

        const native = container.querySelector('input') as HTMLInputElement;
        const control = container.querySelector('.rp-input') as HTMLElement;

        expect(native.checkValidity()).toBe(false);
        expect(native.validationMessage).toBe('Use a supported CSS color.');
        expect(native.getAttribute('aria-invalid')).toBe('true');
        expect(control.classList.contains('rp-input--invalid')).toBe(true);

        input(native, '#abcdef');
        await flush();

        expect(native.checkValidity()).toBe(true);
        expect(native.validationMessage).toBe('');
        expect(native.hasAttribute('aria-invalid')).toBe(false);
        expect(control.classList.contains('rp-input--invalid')).toBe(false);
    });

    it('emits typed color values from the text input', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorInput, {
                        modelValue: '',
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        const native = container.querySelector('input') as HTMLInputElement;
        input(native, '#abcdef');
        await flush();

        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onUpdate).toHaveBeenCalledWith('#abcdef');
    });

    it('exposes preview state through the left slot', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        ColorInput,
                        {
                            modelValue: '#4992d1',
                        },
                        {
                            left: (slotProps: { color?: string; empty: boolean }) =>
                                h(
                                    'span',
                                    {
                                        class: 'custom-left',
                                        'data-color': slotProps.color,
                                        'data-empty': String(slotProps.empty),
                                    },
                                    'Preview',
                                ),
                        },
                    );
                },
            }),
        );

        await flush();

        const customLeft = container.querySelector('.rp-input__left .custom-left') as HTMLElement;

        expect(customLeft.dataset.color).toBe('#4992d1');
        expect(customLeft.dataset.empty).toBe('false');
        expect(container.querySelector('.rp-color-input__preview')).toBeNull();
    });

    it('opens the picker on input focus and emits selected swatch colors', async () => {
        const onUpdate = vi.fn();
        const onOpen = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorInput, {
                        modelValue: '#4992d1',
                        swatches: ['#00ff00'],
                        'onUpdate:modelValue': onUpdate,
                        'onUpdate:open': onOpen,
                    });
                },
            }),
        );

        await flush();

        const native = container.querySelector('input') as HTMLInputElement;
        native.focus();
        await flush();

        const popover = container.querySelector('.rp-popover__content') as HTMLElement;
        expect(popover.style.display).not.toBe('none');
        expect(onOpen).toHaveBeenLastCalledWith(true);
        expect(native.getAttribute('aria-expanded')).toBe('true');

        click(container.querySelector('.rp-color-picker__swatch') as HTMLButtonElement);
        await flush();

        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onUpdate).toHaveBeenCalledWith('#00ff00');
    });

    it('reopens the picker by click or ArrowDown while the input remains focused', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorInput, {
                        modelValue: '#4992d1',
                    });
                },
            }),
        );

        const native = container.querySelector('input') as HTMLInputElement;
        const picker = container.querySelector('.rp-popover__content') as HTMLElement;

        native.focus();
        await flush();

        keydown(native, 'Escape');
        await waitTransition();

        expect(document.activeElement).toBe(native);
        expect(picker.style.display).toBe('none');
        expect(native.getAttribute('aria-expanded')).toBe('false');

        click(native);
        await flush();

        expect(picker.style.display).not.toBe('none');
        expect(native.getAttribute('aria-expanded')).toBe('true');

        keydown(native, 'Escape');
        await waitTransition();
        keydown(native, 'ArrowDown');
        await flush();

        expect(picker.style.display).not.toBe('none');
        expect(native.getAttribute('aria-expanded')).toBe('true');
    });

    it('restores input focus when Escape closes the picker from inside', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorInput, {
                        modelValue: '#4992d1',
                    });
                },
            }),
        );

        const native = container.querySelector('input') as HTMLInputElement;
        const picker = container.querySelector('.rp-popover__content') as HTMLElement;

        native.focus();
        await flush();

        const saturation = container.querySelector(
            '.rp-color-picker__axis-input--saturation',
        ) as HTMLElement;
        saturation.focus();
        keydown(saturation, 'Escape');
        await waitTransition();

        expect(document.activeElement).toBe(native);
        expect(picker.style.display).toBe('none');
        expect(native.getAttribute('aria-expanded')).toBe('false');
    });

    it('emits close when focus leaves an initially controlled-open picker', async () => {
        const onOpen = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorInput, {
                        modelValue: '#4992d1',
                        open: true,
                        'onUpdate:open': onOpen,
                    });
                },
            }),
        );
        const outside = document.createElement('button');
        container.append(outside);

        await flush();

        const saturation = container.querySelector(
            '.rp-color-picker__axis-input--saturation',
        ) as HTMLElement;
        saturation.focus();
        outside.focus();
        await flush();

        expect(onOpen).toHaveBeenLastCalledWith(false);
    });

    it('closes the picker when focus leaves the color input', async () => {
        const onOpen = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorInput, {
                        modelValue: '#4992d1',
                        'onUpdate:open': onOpen,
                    });
                },
            }),
        );

        const native = container.querySelector('input') as HTMLInputElement;
        const picker = container.querySelector('.rp-popover__content') as HTMLElement;
        const outside = document.createElement('button');
        container.append(outside);

        native.focus();
        await flush();

        const saturation = container.querySelector(
            '.rp-color-picker__axis-input--saturation',
        ) as HTMLElement;
        saturation.focus();
        await flush();

        expect(picker.style.display).not.toBe('none');
        expect(onOpen).toHaveBeenLastCalledWith(true);

        outside.focus();
        await waitTransition();

        expect(picker.style.display).toBe('none');
        expect(onOpen).toHaveBeenLastCalledWith(false);
    });

    it('keeps the picker closed and controls disabled when disabled', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorInput, {
                        disabled: true,
                        modelValue: '#4992d1',
                    });
                },
            }),
        );

        await flush();

        const native = container.querySelector('input') as HTMLInputElement;

        expect(native.disabled).toBe(true);
        expect(container.querySelector('.rp-color-input__trigger')).toBeNull();
        expect(container.querySelector('.rp-popover__content')).toBeNull();
    });

    it('renders an empty preview for unsupported color strings', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorInput, {
                        modelValue: 'not-a-color',
                    });
                },
            }),
        );

        await flush();

        expect(container.querySelector('.rp-color-swatch')).toBeNull();
        expect(container.querySelector('.rp-color-input__preview--empty')).toBeTruthy();
        expect((container.querySelector('input') as HTMLInputElement).checkValidity()).toBe(true);
    });

    it('keeps the picker closed when readonly', async () => {
        const onOpen = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorInput, {
                        readonly: true,
                        modelValue: '#4992d1',
                        swatches: ['#00ff00'],
                        'onUpdate:open': onOpen,
                    });
                },
            }),
        );

        await flush();

        const native = container.querySelector('input') as HTMLInputElement;

        native.focus();
        click(native);
        await flush();

        expect(native.readOnly).toBe(true);
        expect(container.querySelector('.rp-popover__content')).toBeNull();
        expect(container.querySelector('.rp-color-picker')).toBeNull();
        expect(onOpen).not.toHaveBeenCalled();
    });
});
