import type { CSSProperties, MaybeRefOrGetter } from 'vue';
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

export interface OverlayLayerProviderProps {
    baseZIndex: number;
}

export interface UseOverlayZIndexOptions {
    baseZIndex?: MaybeRefOrGetter<number | null | undefined>;
    defaultBaseZIndex?: number;
    offset?: MaybeRefOrGetter<number>;
    aboveParent?: MaybeRefOrGetter<boolean>;
}
