export const colorPickerFormats = ['hex', 'hexa', 'rgb', 'rgba', 'hsl', 'hsla'] as const;

export type ColorPickerFormat = (typeof colorPickerFormats)[number];

export interface ColorPickerSelection {
    saturation: number;
    value: number;
    opacity?: number;
}

export type ColorPickerValue = string;

export interface ColorPickerProps {
    id?: string;
    modelValue: ColorPickerValue;
    format?: ColorPickerFormat;
    readonly?: boolean;
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
}

export type ColorPickerSliderVariant = 'hue' | 'opacity';

export interface ColorPickerSliderProps {
    variant: ColorPickerSliderVariant;
    value?: number;
    color?: string;
    readonly?: boolean;
}
