import type { InputHTMLAttributes } from 'vue';
import type { ColorPickerFormat, ColorPickerValue } from '../color-picker/types';
import type { InputRadius, InputSize } from '../input/types';
import type { PopoverPlacement } from '../popover/types';
import type { StylesApiProps } from '../../styles-api';

export const colorInputParts = [
    'root',
    'control',
    'input',
    'preview',
    'eyeDropper',
    'content',
    'picker',
    'pickerControl',
    'pickerHandle',
    'pickerSwatches',
    'pickerSwatch',
] as const;
export type ColorInputPart = (typeof colorInputParts)[number];

export interface ColorInputProps extends StylesApiProps<ColorInputPart> {
    id?: string;
    name?: string;
    modelValue: ColorPickerValue;
    format?: ColorPickerFormat;
    size?: InputSize;
    radius?: InputRadius;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    disallowInput?: boolean;
    swatchesOnly?: boolean;
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
    keepMounted?: boolean;
    popoverId?: string;
    pickerAriaLabel?: string;
    withEyeDropper?: boolean;
    eyeDropperAriaLabel?: string;
}
