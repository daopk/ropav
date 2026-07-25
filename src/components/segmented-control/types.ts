import type { InputHTMLAttributes } from 'vue';
import type { StylesApiProps } from '../../styles-api';
import { componentColors, type ComponentColorValue } from '../../utils/componentColors';

export const segmentedControlParts = ['root', 'control', 'input', 'indicator', 'label'] as const;
export const segmentedControlColors = componentColors;
export const segmentedControlSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
export const segmentedControlRadiuses = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'full'] as const;
export const segmentedControlOrientations = ['horizontal', 'vertical'] as const;

export type SegmentedControlPart = (typeof segmentedControlParts)[number];
export type SegmentedControlColor = ComponentColorValue;
export type SegmentedControlSize = (typeof segmentedControlSizes)[number];
export type SegmentedControlRadius = (typeof segmentedControlRadiuses)[number];
export type SegmentedControlOrientation = (typeof segmentedControlOrientations)[number];
export type SegmentedControlValue = string | number;

export interface SegmentedControlOption {
    label: string;
    value: SegmentedControlValue;
    disabled?: boolean;
}

export interface SegmentedControlOptionSlotProps {
    option: SegmentedControlOption;
    selected: boolean;
    disabled: boolean;
}

export interface SegmentedControlProps extends StylesApiProps<SegmentedControlPart> {
    id?: string;
    name?: string;
    form?: string;
    modelValue?: SegmentedControlValue | null;
    defaultValue?: SegmentedControlValue | null;
    options?: SegmentedControlOption[];
    color?: SegmentedControlColor;
    autoContrast?: boolean;
    contrastColor?: string;
    size?: SegmentedControlSize;
    radius?: SegmentedControlRadius;
    orientation?: SegmentedControlOrientation;
    fullWidth?: boolean;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
    inputAttrs?: InputHTMLAttributes;
    validationMessage?: string;
}
