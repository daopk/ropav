import type { InputHTMLAttributes } from 'vue';
import type { TooltipProps } from '../tooltip/types';
import { componentColors, type ComponentColorValue } from '../../utils/componentColors';
import type { StylesApiProps } from '../../styles-api';

export const sliderParts = [
    'root',
    'label',
    'value',
    'track',
    'range',
    'input',
    'thumb',
    'mark',
    'markLabel',
    'tooltip',
] as const;
export const rangeSliderParts = [
    'root',
    'label',
    'value',
    'track',
    'range',
    'input',
    'thumb',
    'mark',
    'markLabel',
    'tooltip',
] as const;
export type SliderPart = (typeof sliderParts)[number];
export type RangeSliderPart = (typeof rangeSliderParts)[number];

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

export type SliderInputAttrs = InputHTMLAttributes;

export type RangeSliderInputAttrs =
    | SliderInputAttrs
    | [SliderInputAttrs | undefined, SliderInputAttrs | undefined];

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

export interface SliderProps extends StylesApiProps<SliderPart> {
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
    ariaLabel?: string;
    ariaValueText?: string | SliderValueFormatter;
    describedby?: string;
    labelledby?: string;
    inputAttrs?: SliderInputAttrs;
}

export interface RangeSliderProps
    extends
        Omit<
            SliderProps,
            | 'modelValue'
            | 'name'
            | 'ariaLabel'
            | 'ariaValueText'
            | 'inputAttrs'
            | 'classNames'
            | 'styles'
        >,
        StylesApiProps<RangeSliderPart> {
    modelValue: RangeSliderValue;
    minRange?: number;
    name?: string | [string, string];
    ariaLabel?: [string, string];
    ariaValueText?: RangeSliderAriaValueText;
    inputAttrs?: RangeSliderInputAttrs;
}
