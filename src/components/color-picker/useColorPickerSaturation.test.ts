import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';
import { mountDomWithApp } from '../../../tests/utils/vue';
import type { ColorPickerSelection } from './types';
import { useColorPickerSaturation } from './useColorPickerSaturation';

interface SaturationHarnessState {
    modelValue: ColorPickerSelection;
    hue: number;
    readonly: boolean;
}

function mountSaturation(initialState: Partial<SaturationHarnessState> = {}) {
    const state = reactive<SaturationHarnessState>({
        modelValue: { saturation: 40, value: 60 },
        hue: 0,
        readonly: false,
        ...initialState,
    });
    const onChange = vi.fn();
    let control!: ReturnType<typeof useColorPickerSaturation>;

    const mounted = mountDomWithApp(
        defineComponent({
            setup() {
                control = useColorPickerSaturation({
                    modelValue: () => state.modelValue,
                    hue: () => state.hue,
                    readonly: () => state.readonly,
                    onChange,
                });

                return () => h('div');
            },
        }),
    );

    return {
        ...mounted,
        state,
        onChange,
        get control() {
            return control;
        },
    };
}

function setRect(element: HTMLElement, rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>) {
    Object.defineProperty(element, 'getBoundingClientRect', {
        configurable: true,
        value: () =>
            ({
                ...rect,
                bottom: rect.top + rect.height,
                right: rect.left + rect.width,
                x: rect.left,
                y: rect.top,
                toJSON: () => ({}),
            }) as DOMRect,
    });
}

describe('useColorPickerSaturation', () => {
    it('normalizes the exposed two-axis selection and hue', () => {
        const { control } = mountSaturation({
            modelValue: { saturation: 120, value: -10 },
            hue: -60,
        });

        expect(control.selection.value).toEqual({ saturation: 100, value: 0 });
        expect(control.normalizedHue.value).toBe(300);
    });

    it('projects pointer coordinates onto explicit saturation and value axes', () => {
        const { container, control, onChange } = mountSaturation();
        const surface = container.firstElementChild as HTMLElement;
        const input = document.createElement('input');
        surface.append(input);
        setRect(surface, { left: 10, top: 20, width: 200, height: 100 });
        control.setSaturationElement(surface);
        control.setSaturationInput(input);

        const event = new MouseEvent('pointerdown', {
            button: 0,
            cancelable: true,
            clientX: 110,
            clientY: 45,
        }) as PointerEvent;
        control.onPointerDown(event);

        expect(event.defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(input);
        expect(onChange).toHaveBeenCalledWith({ saturation: 50, value: 75 });

        window.dispatchEvent(new MouseEvent('pointerup'));
    });

    it('handles keyboard steps and keeps readonly range input state controlled', () => {
        const { control, onChange, state } = mountSaturation();
        const keyboardEvent = new KeyboardEvent('keydown', {
            cancelable: true,
            key: 'ArrowRight',
            shiftKey: true,
        });

        control.onAxisKeydown(keyboardEvent, 'saturation');
        expect(keyboardEvent.defaultPrevented).toBe(true);
        expect(onChange).toHaveBeenCalledWith({ saturation: 50, value: 60 });

        state.readonly = true;
        const readonlyKeyboardEvent = new KeyboardEvent('keydown', {
            cancelable: true,
            key: 'ArrowUp',
        });
        control.onAxisKeydown(readonlyKeyboardEvent, 'value');
        expect(readonlyKeyboardEvent.defaultPrevented).toBe(true);
        expect(onChange).toHaveBeenCalledOnce();

        const input = document.createElement('input');
        input.value = '90';
        control.onAxisInput({ currentTarget: input } as unknown as Event, 'saturation');
        expect(input.value).toBe('40');
        expect(onChange).toHaveBeenCalledOnce();
    });
});
