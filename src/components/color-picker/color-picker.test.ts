import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';

import { flush, keydown, mountDom } from '../../../tests/utils/vue';
import ColorPicker from './color-picker.vue';
import {
    formatColorPickerValue,
    parseColorPickerValue,
    type ColorPickerHsvColor,
} from './color-picker-utils';
import { colorPickerSizes, type ColorPickerFormat, type ColorPickerValue } from './types';

function setRect(el: Element, rect: Partial<DOMRect>) {
    const getBoundingClientRect = vi.fn(() => ({
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
    }));
    Object.defineProperty(el, 'getBoundingClientRect', {
        configurable: true,
        value: getBoundingClientRect,
    });
    return getBoundingClientRect;
}

async function flushPointerUpdates() {
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    await flush();
}

function dispatchPointer(
    target: EventTarget,
    type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
    {
        button = 0,
        clientX = 0,
        clientY = 0,
        isPrimary = true,
        pointerId = 1,
    }: {
        button?: number;
        clientX?: number;
        clientY?: number;
        isPrimary?: boolean;
        pointerId?: number;
    } = {},
) {
    const init = { bubbles: true, button, cancelable: true, clientX, clientY };
    const event =
        typeof window.PointerEvent === 'function'
            ? new PointerEvent(type, { ...init, isPrimary, pointerId })
            : new MouseEvent(type, init);
    if (!('pointerId' in event)) {
        Object.defineProperties(event, {
            isPrimary: { value: isPrimary },
            pointerId: { value: pointerId },
        });
    }
    target.dispatchEvent(event);
}

function formatHsvColor(color: Partial<ColorPickerHsvColor>, format: ColorPickerFormat = 'hex') {
    return formatColorPickerValue(
        {
            hue: 0,
            saturation: 0,
            value: 0,
            opacity: 100,
            ...color,
        },
        format,
    );
}

function updateFormattedColor(
    modelValue: string,
    nextColor: Partial<ColorPickerHsvColor>,
    format: ColorPickerFormat = 'hex',
) {
    const parsedColor = parseColorPickerValue(modelValue);
    if (!parsedColor) throw new Error(`Expected parseable color: ${modelValue}`);

    return formatColorPickerValue({ ...parsedColor, ...nextColor }, format);
}

describe('ColorPicker', () => {
    it('renders separate saturation and value axes with a hue bar', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        modelValue: '#ff0000',
                    });
                },
            }),
        );

        await flush();

        const panel = container.querySelector('.rp-color-picker__saturation') as HTMLElement;
        const saturationAxis = container.querySelector(
            '.rp-color-picker__axis-input--saturation',
        ) as HTMLInputElement;
        const valueAxis = container.querySelector(
            '.rp-color-picker__axis-input--value',
        ) as HTMLInputElement;
        const hueBar = container.querySelector('.rp-color-picker__hue') as HTMLElement;
        const handle = container.querySelector('.rp-color-picker__handle')!;

        expect(container.querySelectorAll('input')).toHaveLength(2);
        expect(container.querySelector('button')).toBeNull();
        expect(panel.getAttribute('role')).toBe('group');
        expect(panel.getAttribute('aria-label')).toBe('Color area');
        expect(saturationAxis.type).toBe('range');
        expect(saturationAxis.getAttribute('aria-label')).toBe('Saturation');
        expect(saturationAxis.getAttribute('aria-orientation')).toBe('horizontal');
        expect(saturationAxis.getAttribute('aria-valuenow')).toBe('100');
        expect(valueAxis.type).toBe('range');
        expect(valueAxis.getAttribute('aria-label')).toBe('Value');
        expect(valueAxis.getAttribute('aria-orientation')).toBe('vertical');
        expect(valueAxis.getAttribute('aria-valuenow')).toBe('100');
        expect(hueBar.getAttribute('role')).toBe('slider');
        expect(hueBar.style.getPropertyValue('--_rp-color-picker-hue')).toBe('0');
        expect(hueBar.style.getPropertyValue('--_rp-color-picker-slider-x')).toBe('0%');
        expect(panel.style.getPropertyValue('--_rp-color-picker-hue')).toBe('0');
        expect(panel.style.getPropertyValue('--_rp-color-picker-saturation-x')).toBe('100%');
        expect(panel.style.getPropertyValue('--_rp-color-picker-saturation-y')).toBe('0%');
        expect(panel.style.getPropertyValue('--_rp-color-picker-current')).toBe('rgb(255 0 0)');
        expect(container.querySelector('.rp-color-picker__opacity')).toBeNull();
        expect(container.querySelector('.rp-color-picker__preview')).toBeNull();
        expect(handle).toBeTruthy();
    });

    it('adds a modifier for each supported size and keeps the default class unchanged', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h('div', [
                        h(ColorPicker, { modelValue: '#ff0000' }),
                        ...colorPickerSizes.map((size) =>
                            h(ColorPicker, { modelValue: '#ff0000', size }),
                        ),
                    ]);
                },
            }),
        );

        await flush();

        const roots = [...container.querySelectorAll('.rp-color-picker')];

        expect(roots).toHaveLength(colorPickerSizes.length + 1);
        expect([...roots[0].classList]).toEqual(['rp-color-picker']);
        for (const [index, size] of colorPickerSizes.entries()) {
            expect([...roots[index + 1].classList]).toEqual([
                'rp-color-picker',
                `rp-color-picker--size-${size}`,
            ]);
        }
    });

    it('emits saturation and value from pointer selection', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        modelValue: '#000000',
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

        expect(document.activeElement).toBe(
            container.querySelector('.rp-color-picker__axis-input--saturation'),
        );
        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onUpdate).toHaveBeenCalledWith(formatHsvColor({ saturation: 50, value: 75 }));
    });

    it('updates saturation and value while dragging until pointer release', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        modelValue: '#000000',
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
        expect(onUpdate).toHaveBeenNthCalledWith(1, formatHsvColor({ saturation: 50, value: 75 }));
        expect(onUpdate).toHaveBeenNthCalledWith(2, formatHsvColor({ saturation: 100, value: 0 }));
    });

    it('coalesces drag updates per frame and flushes the latest pointer on release', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        modelValue: '#000000',
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        let queuedFrame: FrameRequestCallback | undefined;
        let nextFrameId = 0;
        const requestFrame = vi
            .spyOn(window, 'requestAnimationFrame')
            .mockImplementation((callback) => {
                queuedFrame = callback;
                nextFrameId += 1;
                return nextFrameId;
            });
        const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

        try {
            const panel = container.querySelector('.rp-color-picker__saturation') as HTMLElement;
            setRect(panel, { left: 10, top: 20, width: 200, height: 100 });
            dispatchPointer(panel, 'pointerdown', {
                clientX: 110,
                clientY: 45,
                pointerId: 7,
            });
            expect(onUpdate).toHaveBeenCalledOnce();
            onUpdate.mockClear();

            dispatchPointer(window, 'pointermove', {
                clientX: 150,
                clientY: 50,
                pointerId: 7,
            });
            dispatchPointer(window, 'pointermove', {
                clientX: 170,
                clientY: 60,
                pointerId: 7,
            });

            expect(requestFrame).toHaveBeenCalledOnce();
            expect(onUpdate).not.toHaveBeenCalled();

            const firstFrame = queuedFrame;
            queuedFrame = undefined;
            firstFrame?.(0);
            await flush();
            expect(onUpdate).toHaveBeenCalledOnce();
            expect(onUpdate).toHaveBeenLastCalledWith(
                formatHsvColor({ saturation: 80, value: 60 }),
            );

            dispatchPointer(window, 'pointermove', {
                clientX: 190,
                clientY: 70,
                pointerId: 7,
            });
            dispatchPointer(window, 'pointermove', {
                clientX: 210,
                clientY: 80,
                pointerId: 7,
            });
            dispatchPointer(window, 'pointerup', { pointerId: 7 });
            await flush();

            expect(onUpdate).toHaveBeenCalledTimes(2);
            expect(onUpdate).toHaveBeenLastCalledWith(
                formatHsvColor({ saturation: 100, value: 40 }),
            );
            expect(cancelFrame).toHaveBeenCalledOnce();
        } finally {
            requestFrame.mockRestore();
            cancelFrame.mockRestore();
        }
    });

    it('caches drag geometry and refreshes it after scrolling', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        modelValue: '#000000',
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const panel = container.querySelector('.rp-color-picker__saturation') as HTMLElement;
        const getPanelRect = setRect(panel, {
            left: 0,
            top: 0,
            width: 100,
            height: 100,
        });
        dispatchPointer(panel, 'pointerdown', { clientX: 20, clientY: 20, pointerId: 8 });
        expect(getPanelRect).toHaveBeenCalledOnce();

        dispatchPointer(window, 'pointermove', { clientX: 30, clientY: 30, pointerId: 8 });
        dispatchPointer(window, 'pointermove', { clientX: 40, clientY: 40, pointerId: 8 });
        await flushPointerUpdates();
        expect(getPanelRect).toHaveBeenCalledOnce();

        getPanelRect.mockReturnValue({
            bottom: 300,
            height: 200,
            left: 100,
            right: 300,
            top: 100,
            width: 200,
            x: 100,
            y: 100,
            toJSON: () => ({}),
        });
        panel.dispatchEvent(new Event('scroll'));
        await flushPointerUpdates();
        expect(getPanelRect).toHaveBeenCalledTimes(2);

        onUpdate.mockClear();
        dispatchPointer(window, 'pointermove', { clientX: 250, clientY: 150, pointerId: 8 });
        await flushPointerUpdates();
        expect(onUpdate).toHaveBeenLastCalledWith(formatHsvColor({ saturation: 75, value: 75 }));
        expect(getPanelRect).toHaveBeenCalledTimes(2);

        dispatchPointer(window, 'pointerup', { pointerId: 8 });
    });

    it('retries geometry measurement after a transient zero-sized layout', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        modelValue: '#000000',
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const panel = container.querySelector('.rp-color-picker__saturation') as HTMLElement;
        const getPanelRect = setRect(panel, { width: 100, height: 100 });
        dispatchPointer(panel, 'pointerdown', { clientX: 20, clientY: 20, pointerId: 11 });
        onUpdate.mockClear();

        getPanelRect.mockReturnValue({
            bottom: 0,
            height: 0,
            left: 0,
            right: 0,
            top: 0,
            width: 0,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        });
        window.dispatchEvent(new Event('resize'));
        await flushPointerUpdates();
        expect(getPanelRect).toHaveBeenCalledTimes(2);

        getPanelRect.mockReturnValue({
            bottom: 300,
            height: 200,
            left: 100,
            right: 300,
            top: 100,
            width: 200,
            x: 100,
            y: 100,
            toJSON: () => ({}),
        });
        dispatchPointer(window, 'pointermove', { clientX: 250, clientY: 150, pointerId: 11 });
        await flushPointerUpdates();

        expect(getPanelRect).toHaveBeenCalledTimes(3);
        expect(onUpdate).toHaveBeenLastCalledWith(formatHsvColor({ saturation: 75, value: 75 }));

        dispatchPointer(window, 'pointerup', { pointerId: 11 });
    });

    it('ignores secondary pointers without interrupting the active drag', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        modelValue: '#000000',
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const panel = container.querySelector('.rp-color-picker__saturation') as HTMLElement;
        const getPanelRect = setRect(panel, { width: 100, height: 100 });
        dispatchPointer(panel, 'pointerdown', { button: 2, clientX: 20, clientY: 20 });
        dispatchPointer(panel, 'pointerdown', {
            clientX: 20,
            clientY: 20,
            isPrimary: false,
        });
        expect(getPanelRect).not.toHaveBeenCalled();
        expect(onUpdate).not.toHaveBeenCalled();

        dispatchPointer(panel, 'pointerdown', { clientX: 20, clientY: 20, pointerId: 9 });
        onUpdate.mockClear();
        dispatchPointer(window, 'pointermove', { clientX: 90, clientY: 10, pointerId: 10 });
        dispatchPointer(window, 'pointerup', { pointerId: 10 });
        dispatchPointer(window, 'pointermove', { clientX: 75, clientY: 25, pointerId: 9 });
        dispatchPointer(window, 'pointerup', { pointerId: 9 });
        await flush();

        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onUpdate).toHaveBeenLastCalledWith(formatHsvColor({ saturation: 75, value: 75 }));
    });

    it('does not emit saturation and value when normalized selection is unchanged', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        modelValue: '#ff0000',
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
                clientX: 210,
                clientY: 20,
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
                        modelValue: '#000000',
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
        expect(onUpdate).toHaveBeenCalledWith(formatHsvColor({ saturation: 0, value: 100 }));
    });

    it('emits color updates from hue bar pointer selection', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        modelValue: '#800000',
                        'onUpdate:modelValue': onUpdate,
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

        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onUpdate).toHaveBeenCalledWith(updateFormattedColor('#800000', { hue: 180 }));
    });

    it('does not emit hue when normalized selection is unchanged', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        modelValue: '#008080',
                        'onUpdate:modelValue': onUpdate,
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

        expect(onUpdate).not.toHaveBeenCalled();

        window.dispatchEvent(new MouseEvent('pointerup'));
    });

    it('emits clamped hue from the extended hue surface', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        modelValue: '#008000',
                        'onUpdate:modelValue': onUpdate,
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

        expect(onUpdate).toHaveBeenCalledOnce();
        expect(onUpdate).toHaveBeenCalledWith(updateFormattedColor('#008000', { hue: 0 }));
    });

    it('updates saturation and value through separate keyboard axes', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        modelValue: '#808080',
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const saturationAxis = container.querySelector('.rp-color-picker__axis-input--saturation')!;
        const valueAxis = container.querySelector('.rp-color-picker__axis-input--value')!;
        keydown(saturationAxis, 'ArrowRight');
        await flush();

        expect(onUpdate).toHaveBeenLastCalledWith(
            updateFormattedColor('#808080', { saturation: 1 }),
        );

        keydown(valueAxis, 'ArrowUp');
        await flush();

        expect(onUpdate).toHaveBeenLastCalledWith(updateFormattedColor('#808080', { value: 51.2 }));
    });

    it('updates hue from hue bar keyboard arrows', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        modelValue: '#404080',
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const hueBar = container.querySelector('.rp-color-picker__hue')!;
        keydown(hueBar, 'ArrowLeft');
        await flush();

        expect(onUpdate).toHaveBeenLastCalledWith(updateFormattedColor('#404080', { hue: 239 }));

        keydown(hueBar, 'End');
        await flush();

        expect(onUpdate).toHaveBeenLastCalledWith(updateFormattedColor('#404080', { hue: 359 }));
    });

    it('does not emit when readonly but remains focusable', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        readonly: true,
                        modelValue: '#6b8fb3',
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-color-picker')!;
        const panel = container.querySelector('.rp-color-picker__saturation') as HTMLElement;
        const saturationAxis = container.querySelector(
            '.rp-color-picker__axis-input--saturation',
        ) as HTMLInputElement;
        const valueAxis = container.querySelector(
            '.rp-color-picker__axis-input--value',
        ) as HTMLInputElement;
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
        keydown(saturationAxis, 'ArrowRight');
        keydown(valueAxis, 'ArrowUp');
        keydown(hueBar, 'ArrowRight');
        await flush();

        expect(onUpdate).not.toHaveBeenCalled();
        expect(root.classList.contains('rp-color-picker--readonly')).toBe(true);
        expect(root.getAttribute('data-readonly')).toBe('');
        expect(panel.hasAttribute('tabindex')).toBe(false);
        expect(saturationAxis.tabIndex).toBe(0);
        expect(valueAxis.tabIndex).toBe(0);
        expect(hueBar.getAttribute('tabindex')).toBe('0');
        expect(panel.getAttribute('aria-readonly')).toBeNull();
        expect(saturationAxis.getAttribute('aria-readonly')).toBe('true');
        expect(valueAxis.getAttribute('aria-readonly')).toBe('true');
        expect(hueBar.getAttribute('aria-readonly')).toBe('true');
        expect(panel.getAttribute('data-readonly')).toBe('');
        expect(hueBar.getAttribute('data-readonly')).toBe('');
    });

    it('forwards control state attrs to the root element exactly once', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker as any, {
                        class: 'custom-color-picker',
                        disabled: true,
                        invalid: true,
                        modelValue: '#b36b6b',
                        required: true,
                    });
                },
            }),
        );

        await flush();

        const root = container.querySelector('.rp-color-picker') as HTMLElement;

        expect(root.hasAttribute('disabled')).toBe(true);
        expect(root.hasAttribute('invalid')).toBe(true);
        expect(root.hasAttribute('required')).toBe(true);
        expect(container.querySelectorAll('[disabled]')).toHaveLength(1);
        expect(container.querySelectorAll('[invalid]')).toHaveLength(1);
        expect(container.querySelectorAll('[required]')).toHaveLength(1);
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
        const onUpdate = vi.fn((nextValue: ColorPickerValue) => {
            value.value = nextValue;
        });
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        format: 'hex',
                        modelValue: value.value,
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
        await flushPointerUpdates();

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

    it('applies labelling and ARIA props to the color area axes', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        id: 'brand-color',
                        describedby: 'brand-color-help brand-color-error',
                        labelledby: 'brand-color-label',
                        modelValue: '#b36b6b',
                    });
                },
            }),
        );

        await flush();

        const panel = container.querySelector('.rp-color-picker__saturation') as HTMLElement;
        const saturationAxis = container.querySelector(
            '.rp-color-picker__axis-input--saturation',
        ) as HTMLInputElement;
        const valueAxis = container.querySelector(
            '.rp-color-picker__axis-input--value',
        ) as HTMLInputElement;

        expect(saturationAxis.id).toBe('brand-color');
        expect(valueAxis.id).toBe('brand-color-value');
        expect(panel.getAttribute('aria-labelledby')).toBe('brand-color-label');
        expect(panel.getAttribute('aria-describedby')).toBe('brand-color-help brand-color-error');
        expect(saturationAxis.getAttribute('aria-describedby')).toBe(
            'brand-color-help brand-color-error',
        );
        expect(valueAxis.getAttribute('aria-describedby')).toBe(
            'brand-color-help brand-color-error',
        );
        expect(saturationAxis.getAttribute('aria-valuenow')).toBe('40');
        expect(valueAxis.getAttribute('aria-valuenow')).toBe('70');
        expect(saturationAxis.getAttribute('aria-valuetext')).toBe('40% saturation, 70% value');
        expect(valueAxis.getAttribute('aria-valuetext')).toBe('40% saturation, 70% value');
    });

    it('renders the default slot as visible label content', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(
                        ColorPicker,
                        {
                            modelValue: '#b36b6b',
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
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        format: 'hex',
                        modelValue: '#000000',
                        swatches: ['#ff0000', 'rgb(0, 128, 0)'],
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

        const swatchGroup = container.querySelector('.rp-color-picker__swatches')!;

        expect(swatchGroup.getAttribute('role')).toBe('radiogroup');
        expect(swatches).toHaveLength(2);
        expect(colorSwatches).toHaveLength(2);
        expect(colorSwatches[0].style.getPropertyValue('--_rp-color-swatch-color')).toBe('#ff0000');
        expect(colorSwatches[0].getAttribute('aria-hidden')).toBe('true');
        expect(colorSwatches[0].getAttribute('role')).toBeNull();
        expect(swatches[0].getAttribute('role')).toBe('radio');
        expect(swatches[0].getAttribute('aria-checked')).toBe('false');
        expect(swatches[0].tabIndex).toBe(0);
        expect(swatches[1].tabIndex).toBe(-1);
        expect(swatches[1].getAttribute('aria-label')).toBe('Select color rgb(0, 128, 0)');

        swatches[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await flush();

        expect(onUpdate).toHaveBeenCalledWith('#008000');
    });

    it('omits invalid swatches instead of rendering enabled no-op buttons', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        modelValue: '#000000',
                        swatches: ['#ff0000', 'not-a-color', 'rgb(255oops, 0, 0)'],
                    });
                },
            }),
        );

        await flush();

        const swatches = container.querySelectorAll('.rp-color-picker__swatch');

        expect(swatches).toHaveLength(1);
        expect(swatches[0].getAttribute('aria-label')).toBe('Select color #ff0000');
    });

    it('renders selectable swatches without picker controls', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        id: 'brand-color',
                        ariaLabel: 'Brand color',
                        describedby: 'brand-color-help',
                        format: 'hex',
                        labelledby: 'brand-color-label',
                        modelValue: '#000000',
                        swatches: ['#ff0000', '#00ff00'],
                        withPicker: false,
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const swatches = container.querySelector('.rp-color-picker__swatches') as HTMLElement;
        const firstSwatch = swatches.querySelector('.rp-color-picker__swatch') as HTMLButtonElement;

        expect(container.querySelector('.rp-color-picker__saturation')).toBeNull();
        expect(container.querySelector('.rp-color-picker__hue')).toBeNull();
        expect(container.querySelector('.rp-color-picker__opacity')).toBeNull();
        expect(swatches.getAttribute('data-with-picker')).toBeNull();
        expect(swatches.getAttribute('role')).toBe('radiogroup');
        expect(swatches.id).toBe('brand-color');
        expect(swatches.getAttribute('aria-label')).toBe('Brand color');
        expect(swatches.getAttribute('aria-describedby')).toBe('brand-color-help');
        expect(swatches.getAttribute('aria-labelledby')).toBe('brand-color-label');

        firstSwatch.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await flush();

        expect(onUpdate).toHaveBeenCalledWith('#ff0000');
    });

    it('renders a check icon for the selected swatch', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
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
        expect(swatches[0].getAttribute('aria-checked')).toBe('false');
        expect(swatches[0].tabIndex).toBe(-1);
        expect(swatches[1].getAttribute('aria-checked')).toBe('true');
        expect(swatches[1].tabIndex).toBe(0);
        expect(swatches[1].querySelector('.rp-color-picker__swatch-check')).toBeTruthy();
    });

    it('uses one tab stop and selects swatches with wrapping arrow navigation', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                setup() {
                    const value = ref<ColorPickerValue>('#00ff00');

                    return () =>
                        h(ColorPicker, {
                            modelValue: value.value,
                            swatches: ['#ff0000', '#00ff00', '#0000ff'],
                            'onUpdate:modelValue': (nextValue: ColorPickerValue) => {
                                onUpdate(nextValue);
                                value.value = nextValue;
                            },
                        });
                },
            }),
        );

        await flush();

        const swatches = container.querySelectorAll(
            '.rp-color-picker__swatch',
        ) as NodeListOf<HTMLButtonElement>;

        expect([...swatches].map((swatch) => swatch.tabIndex)).toEqual([-1, 0, -1]);

        swatches[1].focus();
        keydown(swatches[1], 'ArrowRight');
        await flush();

        expect(document.activeElement).toBe(swatches[2]);
        expect(onUpdate).toHaveBeenLastCalledWith('#0000ff');
        expect([...swatches].map((swatch) => swatch.getAttribute('aria-checked'))).toEqual([
            'false',
            'false',
            'true',
        ]);
        expect([...swatches].map((swatch) => swatch.tabIndex)).toEqual([-1, -1, 0]);

        keydown(swatches[2], 'ArrowDown');
        await flush();

        expect(document.activeElement).toBe(swatches[0]);
        expect(onUpdate).toHaveBeenLastCalledWith('#ff0000');

        keydown(swatches[0], 'ArrowLeft');
        await flush();

        expect(document.activeElement).toBe(swatches[2]);
        expect(onUpdate).toHaveBeenLastCalledWith('#0000ff');

        keydown(swatches[2], 'ArrowUp');
        await flush();

        expect(document.activeElement).toBe(swatches[1]);
        expect(onUpdate).toHaveBeenLastCalledWith('#00ff00');
    });

    it('lets swatchesPerRow fill the available width regardless of picker size', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        modelValue: '#000000',
                        size: 'xs',
                        swatches: ['#ff0000', '#00ff00', '#0000ff', '#ffffff'],
                        swatchesPerRow: 3,
                    });
                },
            }),
        );

        await flush();

        const swatches = container.querySelector('.rp-color-picker__swatches') as HTMLElement;
        const colorSwatches = [...container.querySelectorAll<HTMLElement>('.rp-color-swatch')];

        expect(swatches.getAttribute('data-fill')).toBe('true');
        expect(swatches.style.getPropertyValue('--_rp-color-picker-swatches-per-row')).toBe('3');
        expect(colorSwatches).toHaveLength(4);
        for (const colorSwatch of colorSwatches) {
            expect(colorSwatch.style.getPropertyValue('--_rp-color-swatch-size')).toBe('100%');
        }
    });

    it('lets styles.swatches override the internal swatches style', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        modelValue: '#000000',
                        swatches: ['#ff0000'],
                        swatchesPerRow: 3,
                        styles: {
                            swatches: { '--_rp-color-picker-swatches-per-row': '7' },
                        },
                    });
                },
            }),
        );

        await flush();

        const swatches = container.querySelector('.rp-color-picker__swatches') as HTMLElement;

        expect(swatches.style.getPropertyValue('--_rp-color-picker-swatches-per-row')).toBe('7');
    });

    it('caps swatchesPerRow at 15', async () => {
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        modelValue: '#000000',
                        swatches: ['#ff0000'],
                        swatchesPerRow: 100,
                    });
                },
            }),
        );

        await flush();

        const swatches = container.querySelector('.rp-color-picker__swatches') as HTMLElement;

        expect(swatches.style.getPropertyValue('--_rp-color-picker-swatches-per-row')).toBe('15');
    });

    it('does not emit swatch selection when readonly', async () => {
        const onUpdate = vi.fn();
        const container = mountDom(
            defineComponent({
                render() {
                    return h(ColorPicker, {
                        readonly: true,
                        modelValue: '#000000',
                        swatches: ['#ff0000'],
                        'onUpdate:modelValue': onUpdate,
                    });
                },
            }),
        );

        await flush();

        const swatch = container.querySelector('.rp-color-picker__swatch') as HTMLButtonElement;

        expect(swatch.disabled).toBe(true);
        expect(swatch.tabIndex).toBe(-1);

        swatch.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await flush();

        expect(onUpdate).not.toHaveBeenCalled();
    });
});
