import type { StylesApiProps } from '../../styles-api';

export const toolbarParts = ['root'] as const;
export const toolbarOrientations = ['horizontal', 'vertical'] as const;

export type ToolbarPart = (typeof toolbarParts)[number];
export type ToolbarOrientation = (typeof toolbarOrientations)[number];

export interface ToolbarProps extends StylesApiProps<ToolbarPart> {
    id?: string;
    orientation?: ToolbarOrientation;
    ariaLabel?: string;
    describedby?: string;
    labelledby?: string;
}
