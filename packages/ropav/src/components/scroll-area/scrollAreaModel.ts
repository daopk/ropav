import type { CSSProperties } from 'vue';
import { toPositiveCssLength } from '@/utils/css';
import { clamp } from '@/utils/number';
import type { ScrollAxis, ScrollDirection } from '@/utils/dom/scroll';
import type { ScrollAreaPosition, ScrollAreaScrollbars, ScrollAreaType } from './types';

export type ScrollBoundary = 'top' | 'bottom' | 'left' | 'right';

export interface ScrollAreaMetrics {
    direction: ScrollDirection;
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

export interface ScrollAreaAxisState {
    direction: ScrollDirection;
    maxPosition: number;
    overflow: boolean;
    position: number;
}

interface ScrollbarVisibilityOptions {
    active: boolean;
    axis: ScrollAxis;
    draggingAxis: ScrollAxis | null;
    focusWithin: boolean;
    hovered: boolean;
    scrolling: boolean;
    type: ScrollAreaType;
}

interface TrackPositionOptions {
    axis: ScrollAxis;
    coordinate: number;
    direction: ScrollDirection;
    maxPosition: number;
    thumbSize: number;
    trackSize: number;
    trackStart: number;
}

interface DragPositionOptions {
    coordinate: number;
    coordinateDirection: 1 | -1;
    maxPosition: number;
    startCoordinate: number;
    startPosition: number;
    travel: number;
}

const boundaryTolerance = 1;

export function createScrollAreaMetrics(): ScrollAreaMetrics {
    return {
        direction: 'ltr',
        clientWidth: 0,
        clientHeight: 0,
        scrollWidth: 0,
        scrollHeight: 0,
        x: 0,
        y: 0,
        overflowX: false,
        overflowY: false,
        horizontalThumbSize: 100,
        horizontalThumbOffset: 0,
        verticalThumbSize: 100,
        verticalThumbOffset: 0,
    };
}

export function isScrollAreaAxisEnabled(
    scrollbars: ScrollAreaScrollbars | false | undefined,
    axis: ScrollAxis,
) {
    if (scrollbars === false) return false;
    if (axis === 'x') return scrollbars === 'x' || scrollbars === 'both';
    return scrollbars === 'y' || scrollbars === 'both';
}

export function isScrollAreaScrollbarActive(
    type: ScrollAreaType,
    enabled: boolean,
    overflowing: boolean,
) {
    if (!enabled || type === 'never') return false;
    return type === 'always' || overflowing;
}

export function isScrollAreaScrollbarVisible({
    active,
    axis,
    draggingAxis,
    focusWithin,
    hovered,
    scrolling,
    type,
}: ScrollbarVisibilityOptions) {
    if (!active) return false;

    switch (type) {
        case 'always':
        case 'auto':
            return true;
        case 'hover':
            return hovered || focusWithin || draggingAxis === axis;
        case 'scroll':
            return scrolling || draggingAxis === axis;
        default:
            return false;
    }
}

export function getScrollAreaAxisPosition(metrics: ScrollAreaMetrics, axis: ScrollAxis) {
    return axis === 'x' ? metrics.x : metrics.y;
}

export function getScrollAreaMaxPosition(metrics: ScrollAreaMetrics, axis: ScrollAxis) {
    return axis === 'x'
        ? Math.max(0, metrics.scrollWidth - metrics.clientWidth)
        : Math.max(0, metrics.scrollHeight - metrics.clientHeight);
}

export function getScrollAreaOverflow(metrics: ScrollAreaMetrics, axis: ScrollAxis) {
    return axis === 'x' ? metrics.overflowX : metrics.overflowY;
}

export function getScrollAreaAxisState(
    metrics: ScrollAreaMetrics,
    axis: ScrollAxis,
): ScrollAreaAxisState {
    return {
        direction: metrics.direction,
        maxPosition: getScrollAreaMaxPosition(metrics, axis),
        overflow: getScrollAreaOverflow(metrics, axis),
        position: getScrollAreaAxisPosition(metrics, axis),
    };
}

export function getReachedScrollAreaBoundaries(
    position: ScrollAreaPosition,
    previousPosition: ScrollAreaPosition,
    metrics: ScrollAreaMetrics,
) {
    const boundaries: ScrollBoundary[] = [];
    appendVerticalBoundaries(boundaries, position, previousPosition, metrics);
    appendHorizontalBoundaries(boundaries, position, previousPosition, metrics);
    return boundaries;
}

function appendVerticalBoundaries(
    boundaries: ScrollBoundary[],
    position: ScrollAreaPosition,
    previousPosition: ScrollAreaPosition,
    metrics: ScrollAreaMetrics,
) {
    if (!metrics.overflowY) return;

    const maxPosition = getScrollAreaMaxPosition(metrics, 'y');
    if (position.y <= boundaryTolerance && previousPosition.y > boundaryTolerance) {
        boundaries.push('top');
    }
    if (
        position.y >= maxPosition - boundaryTolerance &&
        previousPosition.y < maxPosition - boundaryTolerance
    ) {
        boundaries.push('bottom');
    }
}

function appendHorizontalBoundaries(
    boundaries: ScrollBoundary[],
    position: ScrollAreaPosition,
    previousPosition: ScrollAreaPosition,
    metrics: ScrollAreaMetrics,
) {
    if (!metrics.overflowX) return;

    const maxPosition = getScrollAreaMaxPosition(metrics, 'x');
    const reachedStart = position.x <= boundaryTolerance && previousPosition.x > boundaryTolerance;
    const reachedEnd =
        position.x >= maxPosition - boundaryTolerance &&
        previousPosition.x < maxPosition - boundaryTolerance;

    if (reachedStart) boundaries.push(metrics.direction === 'rtl' ? 'right' : 'left');
    if (reachedEnd) boundaries.push(metrics.direction === 'rtl' ? 'left' : 'right');
}

export function getScrollAreaTrackPosition({
    axis,
    coordinate,
    direction,
    maxPosition,
    thumbSize,
    trackSize,
    trackStart,
}: TrackPositionOptions) {
    const travel = Math.max(0, trackSize - thumbSize);
    if (travel === 0) return undefined;

    const physicalRatio = clamp((coordinate - trackStart - thumbSize / 2) / travel, 0, 1);
    const logicalRatio = axis === 'x' && direction === 'rtl' ? 1 - physicalRatio : physicalRatio;
    return logicalRatio * maxPosition;
}

export function getScrollAreaDragPosition({
    coordinate,
    coordinateDirection,
    maxPosition,
    startCoordinate,
    startPosition,
    travel,
}: DragPositionOptions) {
    if (travel <= 0) return startPosition;

    const delta = coordinate - startCoordinate;
    return startPosition + (coordinateDirection * delta * maxPosition) / travel;
}

export function getScrollAreaRootStyle(scrollbarSize: number | string | undefined): CSSProperties {
    const length = toPositiveCssLength(scrollbarSize);
    return length ? { '--_rp-scroll-area-scrollbar-size': length } : {};
}
