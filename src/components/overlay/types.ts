import type { CSSProperties } from 'vue';

export type OverlayZIndex = CSSProperties['zIndex'];

export type OverlayBlur = number | string;

export interface OverlayProps {
    color?: string;
    opacity?: number;
    gradient?: string;
    blur?: OverlayBlur;
    zIndex?: OverlayZIndex;
    interactive?: boolean;
    disabled?: boolean;
}
