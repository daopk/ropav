import type { StylesApiProps } from '../../styles-api';

export const aspectRatioParts = ['root'] as const;
export type AspectRatioPart = (typeof aspectRatioParts)[number];

export interface AspectRatioProps extends StylesApiProps<AspectRatioPart> {
    ratio?: number;
}
