import type { TooltipColor, TooltipOffset, TooltipPlacement } from '../tooltip/types';

export const sliderColors = [
    'primary',
    'secondary',
    'success',
    'warning',
    'danger',
    'info',
    'neutral',
] as const;

export const sliderSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

export const sliderOrientations = ['horizontal', 'vertical'] as const;

export type SliderPresetColor = (typeof sliderColors)[number];

export type SliderColor = SliderPresetColor | (string & {});

export type SliderSize = (typeof sliderSizes)[number];

export type SliderOrientation = (typeof sliderOrientations)[number];

export type SliderValueFormatter = (value: number) => string | number;

export type SliderTooltipMode = 'hover' | 'always';

export interface SliderTooltipOptions {
    mode?: SliderTooltipMode;
    id?: string;
    placement?: TooltipPlacement;
    color?: TooltipColor;
    offset?: TooltipOffset;
    openDelay?: number;
    arrow?: boolean;
}

export type SliderTooltip = false | SliderTooltipMode | SliderTooltipOptions;

export type SliderMarkColor = SliderColor;

export interface SliderMark {
    value: number;
    label?: string | number;
    color?: SliderMarkColor;
    hidden?: boolean;
}

export type SliderMarkInput = number | SliderMark;

export interface SliderThumbStyle {
    size?: number | string;
    border?: number | string;
    padding?: number | string;
}

export interface SliderProps {
    id?: string;
    name?: string;
    modelValue: number;
    min?: number;
    max?: number;
    step?: number | 'any';
    marks?: SliderMarkInput[];
    thumbStyle?: SliderThumbStyle;
    tooltip?: SliderTooltip;
    formatValue?: SliderValueFormatter;
    color?: SliderColor;
    size?: SliderSize;
    orientation?: SliderOrientation;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    valid?: boolean;
    ariaLabel?: string;
    ariaValueText?: string | SliderValueFormatter;
    describedby?: string;
    labelledby?: string;
}
