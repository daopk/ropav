import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';

import { flush, keydown, mountDom } from '../../../tests/utils/vue';
import ColorPicker from './color-picker.vue';
import type { ColorPickerFormat, ColorPickerValue } from './types';

function setRect(el: Element, rect: Partial<DOMRect>) {
    Object.defineProperty(el, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({
            bottom: 0,
            height: 100,
            left: 0,
            right: 0,
            top: 0,
            width: 100,
            x: 0,
            y: 0,
            toJSON: () => ({}),
            ...rect,
        }),
    });
}

describe('ColorPicker', () => {
    it('renders the saturation panel and hue bar without native inputs or buttons', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        hue: 210,
                        modelValue: { saturation: 40, value: 70 },
                    });
                },
            }),
        );

        await flush();

        const panel = container.querySelector('.rp-color-picker__saturation') as HTMLElement;
        const hueBar = container.querySelector('.rp-color-picker__hue') as HTMLElement;
        const handle = container.querySelector('.rp-color-picker__handle')!;

        expect(container.querySelector('input')).toBeNull();
        expect(container.querySelector('button')).toBeNull();
        expect(panel.getAttribute('role')).toBe('slider');
        expect(hueBar.getAttribute('role')).toBe('slider');
        expect(hueBar.style.getPropertyValue('--_rp-color-picker-hue')).toBe('210');
        expect(
            Number.parseFloat(hueBar.style.getPropertyValue('--_rp-color-picker-slider-x')),
        ).toBeCloseTo(58.5);
        expect(panel.style.getPropertyValue('--_rp-color-picker-hue')).toBe('210');
        expect(panel.style.getPropertyValue('--_rp-color-picker-saturation-x')).toBe('40%');
        expect(panel.style.getPropertyValue('--_rp-color-picker-saturation-y')).toBe('30%');
        expect(panel.style.getPropertyValue('--_rp-color-picker-current')).toBe('rgb(107 143 179)');
        expect(container.querySelector('.rp-color-picker__opacity')).toBeNull();
        expect(container.querySelector('.rp-color-picker__preview')).toBeNull();
        expect(handle).toBeTruthy();
    });

    it('emits saturation and value from pointer selection', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        modelValue: { saturation: 0, value: 0 },
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const panel = container.querySelector('.rp-color-picker__saturation') as HTMLElement;
        setRect(panel, { left: 10, top: 20, width: 200, height: 100 });

        panel.dispatchEvent(
            new MouseEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                clientX: 110,
                clientY: 45,
            }),
        );
        await flush();

        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onUpdate).toHaveBeenCalledWith({ saturation: 50, value: 75 });
    });

    it('updates saturation and value while dragging until pointer release', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        modelValue: { saturation: 0, value: 0 },
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const panel = container.querySelector('.rp-color-picker__saturation') as HTMLElement;
        setRect(panel, { left: 10, top: 20, width: 200, height: 100 });

        panel.dispatchEvent(
            new MouseEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                clientX: 110,
                clientY: 45,
            }),
        );
        window.dispatchEvent(
            new MouseEvent('pointermove', {
                clientX: 210,
                clientY: 120,
            }),
        );
        window.dispatchEvent(new MouseEvent('pointerup'));
        window.dispatchEvent(
            new MouseEvent('pointermove', {
                clientX: 10,
                clientY: 20,
            }),
        );
        await flush();

        expect(onUpdate).toHaveBeenCalledTimes(2);
        expect(onUpdate).toHaveBeenNthCalledWith(1, { saturation: 50, value: 75 });
        expect(onUpdate).toHaveBeenNthCalledWith(2, { saturation: 100, value: 0 });
    });

    it('does not emit saturation and value when normalized selection is unchanged', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        modelValue: { saturation: 50, value: 75 },
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const panel = container.querySelector('.rp-color-picker__saturation') as HTMLElement;
        setRect(panel, { left: 10, top: 20, width: 200, height: 100 });

        panel.dispatchEvent(
            new MouseEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                clientX: 110,
                clientY: 45,
            }),
        );
        await flush();

        expect(onUpdate).not.toHaveBeenCalled();

        window.dispatchEvent(new MouseEvent('pointerup'));
    });

    it('emits clamped values from the extended saturation surface', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        modelValue: { saturation: 50, value: 50 },
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const panel = container.querySelector('.rp-color-picker__saturation') as HTMLElement;
        const surface = container.querySelector('.rp-color-picker__surface') as HTMLElement;
        setRect(panel, { left: 10, top: 20, width: 200, height: 100 });

        surface.dispatchEvent(
            new MouseEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                clientX: 5,
                clientY: 15,
            }),
        );
        await flush();

        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onUpdate).toHaveBeenCalledWith({ saturation: 0, value: 100 });
    });

    it('emits hue updates from hue bar pointer selection', async () => {
        const onHueUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        hue: 0,
                        modelValue: { saturation: 50, value: 50 },
                        'onUpdate:hue': onHueUpdate,
                    });
                },
            }),
        );

        await flush();

        const hueBar = container.querySelector('.rp-color-picker__hue') as HTMLElement;
        setRect(hueBar, { left: 10, width: 200 });

        hueBar.dispatchEvent(
            new MouseEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                clientX: 110,
            }),
        );
        await flush();

        expect(onHueUpdate).toHaveBeenCalledOnce();
        expect(onHueUpdate).toHaveBeenCalledWith(180);
    });

    it('does not emit hue when normalized selection is unchanged', async () => {
        const onHueUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        hue: 180,
                        modelValue: { saturation: 50, value: 50 },
                        'onUpdate:hue': onHueUpdate,
                    });
                },
            }),
        );

        await flush();

        const hueBar = container.querySelector('.rp-color-picker__hue') as HTMLElement;
        setRect(hueBar, { left: 10, width: 200 });

        hueBar.dispatchEvent(
            new MouseEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                clientX: 110,
            }),
        );
        await flush();

        expect(onHueUpdate).not.toHaveBeenCalled();

        window.dispatchEvent(new MouseEvent('pointerup'));
    });

    it('emits clamped hue from the extended hue surface', async () => {
        const onHueUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        hue: 120,
                        modelValue: { saturation: 50, value: 50 },
                        'onUpdate:hue': onHueUpdate,
                    });
                },
            }),
        );

        await flush();

        const hueBar = container.querySelector('.rp-color-picker__hue') as HTMLElement;
        const hueSurface = container.querySelector('.rp-color-picker__hue-surface') as HTMLElement;
        setRect(hueBar, { left: 10, width: 200 });

        hueSurface.dispatchEvent(
            new MouseEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                clientX: 5,
            }),
        );
        await flush();

        expect(onHueUpdate).toHaveBeenCalledOnce();
        expect(onHueUpdate).toHaveBeenCalledWith(0);
    });

    it('updates saturation and value from keyboard arrows', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        modelValue: { saturation: 50, value: 50 },
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const panel = container.querySelector('.rp-color-picker__saturation')!;
        keydown(panel, 'ArrowRight');
        await flush();

        expect(onUpdate).toHaveBeenLastCalledWith({ saturation: 51, value: 50 });

        keydown(panel, 'ArrowUp');
        await flush();

        expect(onUpdate).toHaveBeenLastCalledWith({ saturation: 50, value: 51 });
    });

    it('updates hue from hue bar keyboard arrows', async () => {
        const onHueUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        hue: 210,
                        modelValue: { saturation: 50, value: 50 },
                        'onUpdate:hue': onHueUpdate,
                    });
                },
            }),
        );

        await flush();

        const hueBar = container.querySelector('.rp-color-picker__hue')!;
        keydown(hueBar, 'ArrowLeft');
        await flush();

        expect(onHueUpdate).toHaveBeenLastCalledWith(209);

        keydown(hueBar, 'End');
        await flush();

        expect(onHueUpdate).toHaveBeenLastCalledWith(359);
    });

    it('does not emit when readonly but remains focusable', async () => {
        const onUpdate = vi.fn();
        const onHueUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        readonly: true,
                        hue: 210,
                        modelValue: { saturation: 40, value: 70 },
                        'onUpdate:hue': onHueUpdate,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-color-picker')!;
        const panel = container.querySelector('.rp-color-picker__saturation') as HTMLElement;
        const hueBar = container.querySelector('.rp-color-picker__hue') as HTMLElement;
        setRect(panel, { width: 100, height: 100 });
        setRect(hueBar, { width: 100 });

        panel.dispatchEvent(
            new MouseEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                clientX: 50,
                clientY: 50,
            }),
        );
        hueBar.dispatchEvent(
            new MouseEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                clientX: 50,
            }),
        );
        keydown(panel, 'ArrowRight');
        keydown(hueBar, 'ArrowRight');
        await flush();

        expect(onUpdate).not.toHaveBeenCalled();
        expect(onHueUpdate).not.toHaveBeenCalled();
        expect(root.classList.contains('rp-color-picker--readonly')).toBe(true);
        expect(root.getAttribute('data-readonly')).toBe('true');
        expect(panel.getAttribute('tabindex')).toBe('0');
        expect(hueBar.getAttribute('tabindex')).toBe('0');
        expect(panel.getAttribute('aria-readonly')).toBe('true');
        expect(hueBar.getAttribute('aria-readonly')).toBe('true');
        expect(panel.getAttribute('data-readonly')).toBe('true');
        expect(hueBar.getAttribute('data-readonly')).toBe('true');
    });

    it('filters unsupported control state attrs from the root element', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker as any, {
                        class: 'custom-color-picker',
                        disabled: true,
                        invalid: true,
                        modelValue: { saturation: 40, value: 70 },
                        required: true,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-color-picker') as HTMLElement;

        expect(root.hasAttribute('disabled')).toBe(false);
        expect(root.hasAttribute('invalid')).toBe(false);
        expect(root.hasAttribute('required')).toBe(false);
        expect(root.classList.contains('custom-color-picker')).toBe(true);
    });

    it('emits formatted string model values for supported color formats', async () => {
        const cases: Array<[ColorPickerFormat, string, string]> = [
            ['hex', '#000000', '#ff0000'],
            ['hexa', '#00000080', '#ff000080'],
            ['rgb', 'rgb(0, 0, 0)', 'rgb(255, 0, 0)'],
            ['rgba', 'rgba(0, 0, 0, 0.5)', 'rgba(255, 0, 0, 0.5)'],
            ['hsl', 'hsl(0, 0%, 0%)', 'hsl(0, 100%, 50%)'],
            ['hsla', 'hsla(0, 0%, 0%, 0.5)', 'hsla(0, 100%, 50%, 0.5)'],
        ];

        for (const [format, modelValue, expected] of cases) {
            const onUpdate = vi.fn();
            const container = mountDom(
                defineComponent({
                    render() {
                        return h(ColorPicker, {
                            format,
                            modelValue,
                            'onUpdate:modelValue': onUpdate,
                        });
                    },
                }),
            );

            await flush();

            const panel = container.querySelector('.rp-color-picker__saturation') as HTMLElement;
            setRect(panel, { left: 0, top: 0, width: 100, height: 100 });

            panel.dispatchEvent(
                new MouseEvent('pointerdown', {
                    bubbles: true,
                    cancelable: true,
                    clientX: 100,
                    clientY: 0,
                }),
            );
            await flush();

            expect(onUpdate).toHaveBeenCalledWith(expected);
        }
    });

    it('formats pure red when the hue slider reaches the right edge', async () => {
        const value = ref<ColorPickerValue>('#ff0000');
        const hue = ref(0);
        const onUpdate = vi.fn((nextValue: ColorPickerValue) => {
            value.value = nextValue;
        });
        const onHueUpdate = vi.fn((nextHue: number) => {
            hue.value = nextHue;
        });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        format: 'hex',
                        hue: hue.value,
                        modelValue: value.value,
                        'onUpdate:hue': onHueUpdate,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const panel = container.querySelector('.rp-color-picker__saturation') as HTMLElement;
        const hueBar = container.querySelector('.rp-color-picker__hue') as HTMLElement;
        setRect(hueBar, { left: 0, width: 100 });

        hueBar.dispatchEvent(
            new MouseEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                clientX: 100,
            }),
        );
        await flush();

        expect(onHueUpdate).toHaveBeenCalledWith(359);
        expect(onUpdate).toHaveBeenCalledWith('#ff0000');
        expect(hueBar.style.getPropertyValue('--_rp-color-picker-hue')).toBe('360');
        expect(panel.style.getPropertyValue('--_rp-color-picker-hue')).toBe('360');
        expect(panel.style.getPropertyValue('--_rp-color-picker-current')).toBe('rgb(255 0 0)');

        window.dispatchEvent(new MouseEvent('pointerup'));
    });

    it('preserves HSV coordinates after emitting quantized string values', async () => {
        const container = mountDom(
            defineComponent({
                setup() {
                    const value = ref<ColorPickerValue>('#ff0000');

                    return () =>
                        h(ColorPicker, {
                            format: 'hex',
                            hue: 0,
                            modelValue: value.value,
                            'onUpdate:modelValue': (nextValue: ColorPickerValue) => {
                                value.value = nextValue;
                            },
                        });
                },
            }),
        );

        await flush();

        const panel = container.querySelector('.rp-color-picker__saturation') as HTMLElement;
        setRect(panel, { left: 0, top: 0, width: 100, height: 100 });

        panel.dispatchEvent(
            new MouseEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                clientX: 50,
                clientY: 100,
            }),
        );
        await flush();

        expect(panel.style.getPropertyValue('--_rp-color-picker-saturation-x')).toBe('50%');
        expect(panel.style.getPropertyValue('--_rp-color-picker-saturation-y')).toBe('100%');

        window.dispatchEvent(
            new MouseEvent('pointermove', {
                clientX: 75,
                clientY: 100,
            }),
        );
        await flush();

        expect(panel.style.getPropertyValue('--_rp-color-picker-saturation-x')).toBe('75%');
        expect(panel.style.getPropertyValue('--_rp-color-picker-saturation-y')).toBe('100%');

        window.dispatchEvent(new MouseEvent('pointerup'));
    });

    it('shows opacity only for alpha color formats', async () => {
        const cases: Array<[ColorPickerFormat, string, boolean]> = [
            ['hex', '#000000', false],
            ['hexa', '#00000080', true],
            ['rgb', 'rgb(0, 0, 0)', false],
            ['rgba', 'rgba(0, 0, 0, 0.5)', true],
            ['hsl', 'hsl(0, 0%, 0%)', false],
            ['hsla', 'hsla(0, 0%, 0%, 0.5)', true],
        ];

        for (const [format, modelValue, visible] of cases) {
            const container = mountDom(
                defineComponent({
                    render() {
                        return h(ColorPicker, { format, modelValue });
                    },
                }),
            );

            await flush();

            expect(Boolean(container.querySelector('.rp-color-picker__opacity'))).toBe(visible);
            expect(container.querySelector('.rp-color-picker__preview')).toBeNull();
        }
    });

    it('emits opacity updates for alpha string formats', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        format: 'rgba',
                        modelValue: 'rgba(255, 0, 0, 0.5)',
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const opacity = container.querySelector('.rp-color-picker__opacity') as HTMLElement;
        setRect(opacity, { left: 10, width: 200 });

        opacity.dispatchEvent(
            new MouseEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                clientX: 60,
            }),
        );
        await flush();

        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onUpdate).toHaveBeenCalledWith('rgba(255, 0, 0, 0.25)');
    });

    it('applies labelling and ARIA props to the saturation panel', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        id: 'brand-color',
                        describedby: 'brand-color-help brand-color-error',
                        labelledby: 'brand-color-label',
                        modelValue: { saturation: 40, value: 70 },
                    });
                },
            }),
        );

        await flush();

        const panel = container.querySelector('.rp-color-picker__saturation') as HTMLElement;

        expect(panel.id).toBe('brand-color');
        expect(panel.getAttribute('aria-labelledby')).toBe('brand-color-label');
        expect(panel.getAttribute('aria-describedby')).toBe('brand-color-help brand-color-error');
        expect(panel.getAttribute('aria-valuenow')).toBe('40');
        expect(panel.getAttribute('aria-valuetext')).toBe('40% saturation, 70% value');
    });

    it('renders the default slot as visible label content', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        ColorPicker,
                        {
                            modelValue: { saturation: 40, value: 70 },
                        },
                        { default: () => 'Saturation' },
                    );
                },
            }),
        );

        await flush();

        expect(container.querySelector('.rp-color-picker__label')?.textContent).toBe('Saturation');
    });

    it('renders swatches below the picker and emits the selected color', async () => {
        const onUpdate = vi.fn();
        const onHueUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        format: 'hex',
                        hue: 0,
                        modelValue: '#000000',
                        swatches: ['#ff0000', 'rgb(0, 128, 0)'],
                        'onUpdate:hue': onHueUpdate,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const swatches = container.querySelectorAll(
            '.rp-color-picker__swatch',
        ) as NodeListOf<HTMLButtonElement>;
        const colorSwatches = container.querySelectorAll(
            '.rp-color-swatch',
        ) as NodeListOf<HTMLElement>;

        expect(container.querySelector('.rp-color-picker__swatches')).toBeTruthy();
        expect(swatches).toHaveLength(2);
        expect(colorSwatches).toHaveLength(2);
        expect(colorSwatches[0].style.getPropertyValue('--_rp-color-swatch-color')).toBe('#ff0000');
        expect(colorSwatches[0].getAttribute('aria-hidden')).toBe('true');
        expect(colorSwatches[0].getAttribute('role')).toBeNull();
        expect(swatches[0].getAttribute('aria-pressed')).toBe('false');
        expect(swatches[1].getAttribute('aria-label')).toBe('Select color rgb(0, 128, 0)');

        swatches[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await flush();

        expect(onHueUpdate).toHaveBeenCalledWith(120);
        expect(onUpdate).toHaveBeenCalledWith('#008000');
    });

    it('renders a check icon for the selected swatch', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        hue: 210,
                        modelValue: '#008000',
                        swatches: ['#ff0000', 'rgb(0, 128, 0)'],
                    });
                },
            }),
        );

        await flush();

        const swatches = container.querySelectorAll(
            '.rp-color-picker__swatch',
        ) as NodeListOf<HTMLButtonElement>;

        expect(swatches[0].querySelector('.rp-color-picker__swatch-check')).toBeNull();
        expect(swatches[1].getAttribute('aria-pressed')).toBe('true');
        expect(swatches[1].querySelector('.rp-color-picker__swatch-check')).toBeTruthy();
    });

    it('does not emit swatch selection when readonly', async () => {
        const onUpdate = vi.fn();
        const onHueUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        readonly: true,
                        modelValue: '#000000',
                        swatches: ['#ff0000'],
                        'onUpdate:hue': onHueUpdate,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const swatch = container.querySelector('.rp-color-picker__swatch') as HTMLButtonElement;

        expect(swatch.disabled).toBe(true);

        swatch.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await flush();

        expect(onHueUpdate).not.toHaveBeenCalled();
        expect(onUpdate).not.toHaveBeenCalled();
    });
});
