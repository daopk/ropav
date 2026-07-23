import { computed, ref } from 'vue';
import {
    COLOR_PICKER_KEYBOARD_LARGE_STEP,
    clampPercent,
    getColorPickerKeyboardValue,
    normalizeHue,
    roundPercent,
} from '@/utils/colorPicker';
import { toHTMLElement, type ComponentElementRef } from '@/utils/dom/componentRef';
import type { ColorPickerSelection } from './types';
import { useColorPickerDrag, type ColorPickerPointerCoordinates } from './useColorPickerDrag';

type ColorPickerAxis = 'saturation' | 'value';

interface UseColorPickerSaturationOptions {
    modelValue: () => Readonly<ColorPickerSelection>;
    hue: () => number;
    readonly: () => boolean;
    onChange: (selection: ColorPickerSelection) => void;
}

export function useColorPickerSaturation({
    modelValue,
    hue,
    readonly,
    onChange,
}: UseColorPickerSaturationOptions) {
    const saturationRef = ref<HTMLElement | null>(null);
    const saturationInputRef = ref<HTMLInputElement | null>(null);
    const selection = computed(() => {
        const currentSelection = modelValue();
        return {
            saturation: clampPercent(currentSelection.saturation),
            value: clampPercent(currentSelection.value),
        };
    });
    const normalizedHue = computed(() => normalizeHue(hue()));

    function setSaturationElement(value: ComponentElementRef) {
        saturationRef.value = toHTMLElement(value);
    }

    function setSaturationInput(value: ComponentElementRef) {
        saturationInputRef.value = toHTMLElement(value) as HTMLInputElement | null;
    }

    function commitSelection(nextSaturation: number, nextValue: number) {
        if (readonly()) return;

        const nextSelection = {
            saturation: roundPercent(clampPercent(nextSaturation)),
            value: roundPercent(clampPercent(nextValue)),
        };
        if (
            nextSelection.saturation === selection.value.saturation &&
            nextSelection.value === selection.value.value
        ) {
            return;
        }

        onChange(nextSelection);
    }

    function updateAxis(axis: ColorPickerAxis, nextValue: number) {
        if (axis === 'saturation') {
            commitSelection(nextValue, selection.value.value);
            return;
        }

        commitSelection(selection.value.saturation, nextValue);
    }

    function onAxisKeydown(event: KeyboardEvent, axis: ColorPickerAxis) {
        const currentValue =
            axis === 'saturation' ? selection.value.saturation : selection.value.value;
        const nextValue = getColorPickerKeyboardValue(
            event.key,
            currentValue,
            100,
            event.shiftKey ? COLOR_PICKER_KEYBOARD_LARGE_STEP : undefined,
        );
        if (nextValue === undefined) return;

        event.preventDefault();
        if (!readonly()) updateAxis(axis, nextValue);
    }

    function onAxisInput(event: Event, axis: ColorPickerAxis) {
        const input = event.currentTarget;
        if (!(input instanceof HTMLInputElement)) return;

        if (readonly()) {
            input.value = String(
                axis === 'saturation' ? selection.value.saturation : selection.value.value,
            );
            return;
        }

        updateAxis(axis, Number(input.value));
    }

    function updateFromTwoDimensionalPointer(
        pointer: ColorPickerPointerCoordinates,
        rect: DOMRect,
    ) {
        if (rect.width <= 0 || rect.height <= 0) return;

        const nextSaturation = ((pointer.clientX - rect.left) / rect.width) * 100;
        const nextValue = 100 - ((pointer.clientY - rect.top) / rect.height) * 100;
        commitSelection(nextSaturation, nextValue);
    }

    const { onPointerDown } = useColorPickerDrag({
        target: saturationRef,
        focusTarget: saturationInputRef,
        readonly,
        isGeometryValid: (rect) => rect.width > 0 && rect.height > 0,
        updateFromPointer: updateFromTwoDimensionalPointer,
    });

    return {
        setSaturationElement,
        setSaturationInput,
        selection,
        normalizedHue,
        onPointerDown,
        onAxisKeydown,
        onAxisInput,
    };
}
