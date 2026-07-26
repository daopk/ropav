import type { StylesApiProps } from '../../styles-api';

export const colorSwatchParts = ['root'] as const;
export type ColorSwatchPart = (typeof colorSwatchParts)[number];

export type ColorSwatchSize = string | number;

export interface ColorSwatchProps extends StylesApiProps<ColorSwatchPart> {
    color: string;
    size?: ColorSwatchSize;
    ariaLabel?: string;
}
