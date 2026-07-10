import { computed } from 'vue';
import { parseColorPickerValue } from '../color-picker/color-picker-utils';
import type { ColorInputProps } from './types';

export function useColorInputValue(
    props: Readonly<ColorInputProps>,
    isControlInvalid: () => boolean,
) {
    const parsedColor = computed(() => parseColorPickerValue(props.modelValue));
    const previewColor = computed(() => (parsedColor.value ? props.modelValue : undefined));
    const hasValidSwatches = computed(() =>
        Boolean(props.swatches?.some((swatch) => parseColorPickerValue(swatch))),
    );
    const hasInvalidColor = computed(
        () => props.validateColor && props.modelValue.trim().length > 0 && !parsedColor.value,
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
