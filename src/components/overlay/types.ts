import type { CSSProperties } from 'vue';

export type OverlayZIndex = CSSProperties['zIndex'];

export interface OverlayProps {
    color?: string;
    opacity?: number;
    gradient?: string;
    zIndex?: OverlayZIndex;
    interactive?: boolean;
    disabled?: boolean;
}
