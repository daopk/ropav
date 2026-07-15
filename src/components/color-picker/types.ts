import type { HTMLAttributes } from 'vue';
import type { StylesApiProps } from '../../styles-api';

export const colorPickerParts = [
    'root',
    'label',
    'control',
    'handle',
    'swatches',
    'swatch',
] as const;
export type ColorPickerPart = (typeof colorPickerParts)[number];

export const colorPickerFormats = ['hex', 'hexa', 'rgb', 'rgba', 'hsl', 'hsla'] as const;

export const colorPickerSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

export type ColorPickerFormat = (typeof colorPickerFormats)[number];

export type ColorPickerSize = (typeof colorPickerSizes)[number];

export interface ColorPickerSelection {
    saturation: number;
    value: number;
    opacity?: number;
}

export type ColorPickerValue = string;

export interface ColorPickerProps extends StylesApiProps<ColorPickerPart> {
    id?: string;
    modelValue: ColorPickerValue;
    format?: ColorPickerFormat;
    size?: ColorPickerSize;
    readonly?: boolean;
    withPicker?: boolean;
    swatches?: string[];
    swatchesPerRow?: number;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
}

export interface ColorPickerSaturationProps {
    id?: string;
    modelValue: ColorPickerSelection;
    hue?: number;
    readonly?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
    controlClass?: HTMLAttributes['class'];
    controlStyle?: HTMLAttributes['style'];
    handleClass?: HTMLAttributes['class'];
    handleStyle?: HTMLAttributes['style'];
}

export type ColorPickerSliderVariant = 'hue' | 'opacity';

export interface ColorPickerSliderProps {
    variant: ColorPickerSliderVariant;
    value?: number;
    color?: string;
    readonly?: boolean;
    controlClass?: HTMLAttributes['class'];
    controlStyle?: HTMLAttributes['style'];
    handleClass?: HTMLAttributes['class'];
    handleStyle?: HTMLAttributes['style'];
}
