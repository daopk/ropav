import { computed } from 'vue';
import { parseColorPickerValue } from '../color-picker/color-picker-utils';
import type { ColorInputProps } from './types';

export function useColorInputValue(
    props: Readonly<ColorInputProps>,
    isControlInvalid: () => boolean,
    getValue: () => string = () => props.modelValue ?? '',
) {
    const currentValue = computed(getValue);
    const parsedColor = computed(() => parseColorPickerValue(currentValue.value));
    const previewColor = computed(() => (parsedColor.value ? currentValue.value : undefined));
    const hasValidSwatches = computed(() =>
        Boolean(props.swatches?.some((swatch) => parseColorPickerValue(swatch))),
    );
    const hasInvalidColor = computed(
        () => props.validateColor && currentValue.value.trim().length > 0 && !parsedColor.value,
    );
    const isInvalid = computed(() => isControlInvalid() || hasInvalidColor.value);
    const colorValidationMessage = computed(() =>
        hasInvalidColor.value ? props.invalidColorMessage : undefined,
    );

    return {
        previewColor,
        hasValidSwatches,
        hasInvalidColor,
        isInvalid,
        colorValidationMessage,
    };
}
