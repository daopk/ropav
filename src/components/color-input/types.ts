import type { InputHTMLAttributes } from 'vue';
import type { ColorPickerFormat, ColorPickerValue } from '../color-picker/types';
import type { InputRadius, InputSize } from '../input/types';
import type { PopoverPlacement } from '../popover/types';

export interface ColorInputProps {
    id?: string;
    name?: string;
    modelValue: ColorPickerValue;
    format?: ColorPickerFormat;
    size?: InputSize;
    radius?: InputRadius;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    invalid?: boolean;
    valid?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
    inputAttrs?: InputHTMLAttributes;
    validateColor?: boolean;
    invalidColorMessage?: string;
    swatches?: string[];
    swatchesPerRow?: number;
    placement?: PopoverPlacement;
    open?: boolean;
    popoverId?: string;
    triggerAriaLabel?: string;
    pickerAriaLabel?: string;
}
