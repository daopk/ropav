import type { TooltipProps } from '../tooltip/types';
import { componentColors, type ComponentColorValue } from '../../utils/componentColors';

export const sliderColors = componentColors;

export const sliderSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

export const sliderOrientations = ['horizontal', 'vertical'] as const;

export type SliderPresetColor = (typeof sliderColors)[number];

export type SliderColor = ComponentColorValue;

export type SliderSize = (typeof sliderSizes)[number];

export type SliderOrientation = (typeof sliderOrientations)[number];

export type SliderValueFormatter = (value: number) => string | number;

export type RangeSliderValue = [number, number];

export type RangeSliderThumb = 'lower' | 'upper';

export type RangeSliderEndpointValueText = string | SliderValueFormatter;

export type RangeSliderAriaValueText =
    | RangeSliderEndpointValueText
    | [RangeSliderEndpointValueText, RangeSliderEndpointValueText];

export type SliderTooltipMode = 'hover' | 'always';

export type SliderTooltipOptions = Pick<
    TooltipProps,
    'id' | 'placement' | 'color' | 'offset' | 'openDelay' | 'arrow'
> & {
    mode?: SliderTooltipMode;
};

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

export interface RangeSliderProps extends Omit<
    SliderProps,
    'modelValue' | 'name' | 'ariaLabel' | 'ariaValueText'
> {
    modelValue: RangeSliderValue;
    minRange?: number;
    name?: string | [string, string];
    ariaLabel?: [string, string];
    ariaValueText?: RangeSliderAriaValueText;
}
