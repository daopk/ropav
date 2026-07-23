import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';
import { mountDomWithApp } from '../../../tests/utils/vue';
import type { ColorPickerSliderVariant } from './types';
import { useColorPickerSlider } from './useColorPickerSlider';

interface SliderHarnessState {
    variant: ColorPickerSliderVariant;
    value: number;
    readonly: boolean;
}

function mountSlider(initialState: Partial<SliderHarnessState> = {}) {
    const state = reactive<SliderHarnessState>({
        variant: 'hue',
        value: 0,
        readonly: false,
        ...initialState,
    });
    const onChange = vi.fn();
    let control!: ReturnType<typeof useColorPickerSlider>;

    const mounted = mountDomWithApp(
        defineComponent({
            setup() {
                control = useColorPickerSlider({
                    variant: () => state.variant,
                    value: () => state.value,
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

function setHorizontalRect(element: HTMLElement, left: number, width: number) {
    Object.defineProperty(element, 'getBoundingClientRect', {
        configurable: true,
        value: () =>
            ({
                bottom: 100,
                height: 100,
                left,
                right: left + width,
                top: 0,
                width,
                x: left,
                y: 0,
                toJSON: () => ({}),
            }) as DOMRect,
    });
}

describe('useColorPickerSlider', () => {
    it('normalizes hue and opacity through one-dimensional slider state', () => {
        const { control, state } = mountSlider({ value: 420 });

        expect(control.sliderState.value).toEqual({
            isHue: true,
            max: 359,
            value: 60,
            outputValue: 60,
        });

        state.variant = 'opacity';
        state.value = 120;
        expect(control.sliderState.value).toEqual({
            isHue: false,
            max: 100,
            value: 100,
            outputValue: 100,
        });
    });

    it('projects only the horizontal pointer coordinate', () => {
        const { container, control, onChange } = mountSlider({
            variant: 'opacity',
            value: 10,
        });
        const slider = container.firstElementChild as HTMLElement;
        setHorizontalRect(slider, 20, 200);
        control.setSliderElement(slider);

        const event = new MouseEvent('pointerdown', {
            button: 0,
            cancelable: true,
            clientX: 170,
            clientY: 999,
        }) as PointerEvent;
        control.onPointerDown(event);

        expect(event.defaultPrevented).toBe(true);
        expect(onChange).toHaveBeenCalledWith(75);

        window.dispatchEvent(new MouseEvent('pointerup'));
    });

    it('handles keyboard bounds while preserving readonly event behavior', () => {
        const { control, onChange, state } = mountSlider({ value: 120 });
        const endEvent = new KeyboardEvent('keydown', {
            cancelable: true,
            key: 'End',
        });
        control.onKeydown(endEvent);

        expect(endEvent.defaultPrevented).toBe(true);
        expect(onChange).toHaveBeenCalledWith(359);

        state.readonly = true;
        const readonlyKeyEvent = new KeyboardEvent('keydown', {
            cancelable: true,
            key: 'ArrowRight',
        });
        control.onKeydown(readonlyKeyEvent);
        expect(readonlyKeyEvent.defaultPrevented).toBe(false);

        const readonlyPointerEvent = new MouseEvent('pointerdown', {
            button: 0,
            cancelable: true,
            clientX: 50,
        }) as PointerEvent;
        control.onPointerDown(readonlyPointerEvent);
        expect(readonlyPointerEvent.defaultPrevented).toBe(false);
        expect(onChange).toHaveBeenCalledOnce();
    });
});
