import { computed, ref } from 'vue';
import {
    clampOpacity,
    clampPercent,
    DEFAULT_HUE,
    formatColorPickerValue,
    getHsvCssColor,
    isColorPickerAlphaFormat,
    normalizeHue,
    parseColorPickerValue,
    roundPercent,
    type ColorPickerHsvColor,
} from '@/utils/colorPicker';
import type {
    ColorPickerFormat,
    ColorPickerProps,
    ColorPickerSelection,
    ColorPickerValue,
} from './types';

type ColorPickerValueProps = Readonly<Pick<ColorPickerProps, 'modelValue' | 'format' | 'readonly'>>;

interface EmittedStringColor {
    value: string;
    format: ColorPickerFormat;
    color: ColorPickerHsvColor;
}

export function useColorPickerValue(
    props: ColorPickerValueProps,
    emitUpdate: (value: ColorPickerValue) => void,
) {
    const format = computed<ColorPickerFormat>(() => props.format ?? 'hex');
    const emittedStringColor = ref<EmittedStringColor | null>(null);
    const selectedColor = computed<ColorPickerHsvColor>(() => {
        const value = props.modelValue;
        const cached = emittedStringColor.value;
        if (cached && cached.value === value && cached.format === format.value) return cached.color;

        return (
            parseColorPickerValue(value) ?? {
                hue: DEFAULT_HUE,
                saturation: 100,
                value: 100,
                opacity: 100,
            }
        );
    });
    const saturationValue = computed<ColorPickerSelection>(() => ({
        saturation: selectedColor.value.saturation,
        value: selectedColor.value.value,
    }));
    const opacityColor = computed(() =>
        getHsvCssColor(
            selectedColor.value.hue,
            selectedColor.value.saturation,
            selectedColor.value.value,
        ),
    );
    const showAlphaControls = computed(() => isColorPickerAlphaFormat(format.value));

    function updateSelection(value: ColorPickerSelection) {
        emitColor({
            saturation: value.saturation,
            value: value.value,
            ...(value.opacity === undefined ? {} : { opacity: value.opacity }),
        });
    }

    function updateHue(value: number) {
        emitColor({ hue: value });
    }

    function updateOpacity(value: number) {
        emitColor({ opacity: value });
    }

    function selectColor(value: string) {
        if (props.readonly) return;

        const parsedColor = parseColorPickerValue(value);
        if (!parsedColor) return;

        emitColor(normalizeColor(parsedColor));
    }

    function isColorSelected(value: string) {
        const parsedColor = parseColorPickerValue(value);
        if (!parsedColor) return false;

        return (
            getComparableColor(normalizeColor(parsedColor)) ===
            getComparableColor(selectedColor.value)
        );
    }

    function emitColor(nextColor: Partial<ColorPickerHsvColor>) {
        const color = normalizeColor({ ...selectedColor.value, ...nextColor });
        const formattedValue = formatColorPickerValue(color, format.value);

        emittedStringColor.value = {
            value: formattedValue,
            format: format.value,
            color,
        };
        emitUpdate(formattedValue);
    }

    return {
        selectedColor,
        saturationValue,
        opacityColor,
        showAlphaControls,
        updateSelection,
        updateHue,
        updateOpacity,
        selectColor,
        isColorSelected,
    };
}

function normalizeColor(color: Partial<ColorPickerHsvColor>): ColorPickerHsvColor {
    return {
        hue: normalizeHue(color.hue),
        saturation: roundPercent(clampPercent(color.saturation)),
        value: roundPercent(clampPercent(color.value)),
        opacity: roundPercent(clampOpacity(color.opacity)),
    };
}

function getComparableColor(color: ColorPickerHsvColor) {
    return formatColorPickerValue(color, 'rgba');
}
