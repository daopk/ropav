import type { ScrollAreaScrollbars, ScrollAreaType } from './types';

export type ScrollAxis = 'x' | 'y';

export interface ScrollAreaMetrics {
    clientWidth: number;
    clientHeight: number;
    scrollWidth: number;
    scrollHeight: number;
    x: number;
    y: number;
    overflowX: boolean;
    overflowY: boolean;
    horizontalThumbSize: number;
    horizontalThumbOffset: number;
    verticalThumbSize: number;
    verticalThumbOffset: number;
}

const minimumThumbSize = 18;

export function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

export function isAxisEnabled(
    scrollbars: ScrollAreaScrollbars | false | undefined,
    axis: ScrollAxis,
) {
    if (scrollbars === false) return false;
    if (axis === 'x') return scrollbars === 'x' || scrollbars === 'both';
    return scrollbars === 'y' || scrollbars === 'both';
}

export function isScrollbarActive(type: ScrollAreaType, enabled: boolean, overflowing: boolean) {
    if (!enabled || type === 'never') return false;
    return type === 'always' || overflowing;
}

export function getThumbGeometry(trackSize: number, viewportSize: number, scrollSize: number) {
    if (trackSize <= 0 || viewportSize <= 0 || scrollSize <= viewportSize) {
        return { size: 100, offsetRatio: 1 };
    }

    const thumbSize = clamp((viewportSize / scrollSize) * trackSize, minimumThumbSize, trackSize);
    const sizeRatio = thumbSize / trackSize;

    return {
        size: sizeRatio * 100,
        offsetRatio: sizeRatio,
    };
}

export function getThumbOffset(position: number, maxPosition: number, sizeRatio: number) {
    if (sizeRatio >= 1 || maxPosition <= 0) return 0;
    return (position / maxPosition) * ((1 - sizeRatio) / sizeRatio) * 100;
}

export function getLengthValue(value: number | string | undefined) {
    if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? `${value}px` : '';
    return value?.trim() ?? '';
}
