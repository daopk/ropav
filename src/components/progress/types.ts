import { componentColors, type ComponentColorValue } from '../../utils/componentColors';

export const progressColors = componentColors;

export const progressSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

export const progressRadiuses = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'full'] as const;

export type ProgressColor = ComponentColorValue;

export type ProgressSize = (typeof progressSizes)[number];

export type ProgressRadius = (typeof progressRadiuses)[number];

export type ProgressValueFormatter = (value: number, percent: number) => string | number;

export interface ProgressProps {
    id?: string;
    value?: number | null;
    min?: number;
    max?: number;
    color?: ProgressColor;
    size?: ProgressSize;
    radius?: ProgressRadius;
    indeterminate?: boolean;
    showValue?: boolean;
    formatValue?: ProgressValueFormatter;
    ariaLabel?: string;
    ariaValueText?: string | ProgressValueFormatter;
    describedby?: string;
    labelledby?: string;
}
