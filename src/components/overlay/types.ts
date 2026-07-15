import type { CSSProperties } from 'vue';
import type { StylesApiProps } from '../../styles-api';

export const overlayParts = ['root'] as const;
export type OverlayPart = (typeof overlayParts)[number];

export type OverlayZIndex = CSSProperties['zIndex'];

export type OverlayBlur = number | string;

export interface OverlayProps extends StylesApiProps<OverlayPart> {
    color?: string;
    opacity?: number;
    gradient?: string;
    blur?: OverlayBlur;
    zIndex?: OverlayZIndex;
    interactive?: boolean;
    disabled?: boolean;
}
