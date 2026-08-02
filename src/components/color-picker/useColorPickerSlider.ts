import { computed, ref } from 'vue';
import {
    COLOR_PICKER_KEYBOARD_LARGE_STEP,
    clampHue,
    clampOpacity,
    getColorPickerKeyboardValue,
    HUE_MAX,
    normalizeHue,
    roundPercent,
} from '@/utils/colorPicker';
import { toHTMLElement, type ComponentElementRef } from '@/utils/dom/componentRef';
import type { ColorPickerSliderVariant } from './types';
import { useColorPickerDrag, type ColorPickerPointerCoordinates } from './useColorPickerDrag';

interface UseColorPickerSliderOptions {
    variant: () => ColorPickerSliderVariant;
    value: () => number;
    readonly: () => boolean;
    onChange: (value: number) => void;
}

export function useColorPickerSlider({
    variant,
    value,
    readonly,
    onChange,
}: UseColorPickerSliderOptions) {
    const sliderRef = ref<HTMLElement | null>(null);
    const sliderState = computed(() => {
        const isHue = variant() === 'hue';
        const normalizedValue = isHue ? normalizeHue(value()) : clampOpacity(value());

        return {
            isHue,
            max: isHue ? HUE_MAX : 100,
            value: normalizedValue,
            outputValue: normalizeOutputValue(normalizedValue, isHue),
        };
    });

    function setSliderElement(element: ComponentElementRef) {
        sliderRef.value = toHTMLElement(element);
    }

    function commitValue(nextValue: number) {
        if (readonly()) return;

        const normalizedNextValue = normalizeOutputValue(nextValue, sliderState.value.isHue);
        if (normalizedNextValue === sliderState.value.outputValue) return;

        onChange(normalizedNextValue);
    }

    function updateFromHorizontalPointer(pointer: ColorPickerPointerCoordinates, rect: DOMRect) {
        if (rect.width <= 0) return;

        const nextValue = ((pointer.clientX - rect.left) / rect.width) * sliderState.value.max;
        commitValue(nextValue);
    }

    const { onPointerDown } = useColorPickerDrag({
        target: sliderRef,
        readonly,
        isGeometryValid: (rect) => rect.width > 0,
        updateFromPointer: updateFromHorizontalPointer,
    });

    function onKeydown(event: KeyboardEvent) {
        if (readonly()) return;

        const nextValue = getColorPickerKeyboardValue(
            event.key,
            sliderState.value.value,
            sliderState.value.max,
            event.shiftKey ? COLOR_PICKER_KEYBOARD_LARGE_STEP : undefined,
        );
        if (nextValue === undefined) return;

        event.preventDefault();
        commitValue(nextValue);
    }

    return { setSliderElement, sliderState, onPointerDown, onKeydown };
}

function normalizeOutputValue(nextValue: number, isHue: boolean) {
    return isHue ? Math.round(clampHue(nextValue)) : roundPercent(clampOpacity(nextValue));
}
