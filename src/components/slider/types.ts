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

export type SliderThumbMode = 'always' | 'interaction';

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

export type RangeSliderValidationMessage = string | [string | undefined, string | undefined];

export type SliderTooltipMode = 'hover' | 'always';

type SliderTooltipBaseOptions = Pick<
    TooltipProps,
    | 'id'
    | 'placement'
    | 'color'
    | 'autoContrast'
    | 'contrastColor'
    | 'offset'
    | 'openDelay'
    | 'arrow'
>;

export type SliderTooltipAnchor = 'thumb' | 'pointer';

export type SliderTooltipOptions =
    | (SliderTooltipBaseOptions & {
          anchor?: 'thumb';
          mode?: SliderTooltipMode;
      })
    | (SliderTooltipBaseOptions & {
          anchor: 'pointer';
          mode?: 'hover';
      });

export type RangeSliderTooltipOptions = SliderTooltipBaseOptions & {
    mode?: SliderTooltipMode;
};

export type SliderTooltip = false | SliderTooltipMode | SliderTooltipOptions;

export type RangeSliderTooltip = false | SliderTooltipMode | RangeSliderTooltipOptions;

export interface SliderTooltipSlotProps {
    value: number;
    formattedValue: string | number;
    percent: number;
    anchor: SliderTooltipAnchor;
}

export interface SliderTrackSlotProps {
    value: number;
    formattedValue: string | number;
    percent: number;
    min: number;
    max: number;
    orientation: SliderOrientation;
    getPercent: (value: number) => number;
}

export interface RangeSliderTrackSlotProps {
    value: RangeSliderValue;
    formattedValue: [string | number, string | number];
    percent: RangeSliderValue;
    min: number;
    max: number;
    orientation: SliderOrientation;
    getPercent: (value: number) => number;
}

export type SliderMarkColor = SliderColor;

export interface SliderMark {
    value: number;
    label?: string | number;
    color?: SliderMarkColor;
    hidden?: boolean;
}

export type SliderMarkInput = number | SliderMark;

export interface RangeSliderThumbOptions {
    size?: number | string;
    border?: number | string;
    padding?: number | string;
}

export interface SliderThumbOptions extends RangeSliderThumbOptions {
    visibility?: SliderThumbMode;
}

export type SliderThumb = false | SliderThumbMode | SliderThumbOptions;

export interface SliderProps extends StylesApiProps<SliderPart> {
    id?: string;
    name?: string;
    form?: string;
    modelValue?: number;
    defaultValue?: number;
    min?: number;
    max?: number;
    step?: number | 'any';
    marks?: SliderMarkInput[];
    thumb?: SliderThumb;
    tooltip?: SliderTooltip;
    formatValue?: SliderValueFormatter;
    color?: SliderColor;
    size?: SliderSize;
    orientation?: SliderOrientation;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    ariaLabel?: string;
    ariaValueText?: string | SliderValueFormatter;
    describedby?: string;
    labelledby?: string;
    inputAttrs?: SliderInputAttrs;
    validationMessage?: string;
}

export interface RangeSliderProps
    extends
        Omit<
            SliderProps,
            | 'modelValue'
            | 'defaultValue'
            | 'name'
            | 'ariaLabel'
            | 'ariaValueText'
            | 'inputAttrs'
            | 'validationMessage'
            | 'thumb'
            | 'tooltip'
            | 'classNames'
            | 'styles'
        >,
        StylesApiProps<RangeSliderPart> {
    modelValue?: RangeSliderValue;
    defaultValue?: RangeSliderValue;
    minRange?: number;
    thumb?: RangeSliderThumbOptions;
    tooltip?: RangeSliderTooltip;
    name?: string | [string, string];
    ariaLabel?: [string, string];
    ariaValueText?: RangeSliderAriaValueText;
    inputAttrs?: RangeSliderInputAttrs;
    validationMessage?: RangeSliderValidationMessage;
}
