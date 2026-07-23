import { clamp } from '../number';

export type ScrollAxis = 'x' | 'y';
export type ScrollDirection = 'ltr' | 'rtl';

export interface KeyboardScrollPositionOptions {
    axis: ScrollAxis;
    key: string;
    current: number;
    pageSize: number;
    maxPosition: number;
    direction: ScrollDirection;
    lineStep: number;
}

export function getScrollDirection(element: Element): ScrollDirection {
    const view = element.ownerDocument.defaultView;
    return view?.getComputedStyle(element).direction === 'rtl' ? 'rtl' : 'ltr';
}

export function getLogicalHorizontalScrollPosition(
    scrollLeft: number,
    maxPosition: number,
    direction: ScrollDirection,
) {
    const position = direction === 'rtl' ? -scrollLeft : scrollLeft;
    return clamp(position, 0, maxPosition);
}

export function getRawHorizontalScrollPosition(
    position: number,
    maxPosition: number,
    direction: ScrollDirection,
) {
    const logicalPosition = clamp(position, 0, maxPosition);
    return direction === 'rtl' && logicalPosition !== 0 ? -logicalPosition : logicalPosition;
}

export function getScrollThumbGeometry(
    trackSize: number,
    viewportSize: number,
    scrollSize: number,
    minimumSize: number,
) {
    if (trackSize <= 0 || viewportSize <= 0 || scrollSize <= viewportSize) {
        return { size: 100, offsetRatio: 1 };
    }

    const thumbSize = clamp((viewportSize / scrollSize) * trackSize, minimumSize, trackSize);
    const sizeRatio = thumbSize / trackSize;
    return { size: sizeRatio * 100, offsetRatio: sizeRatio };
}

export function getScrollThumbOffset(position: number, maxPosition: number, sizeRatio: number) {
    if (sizeRatio >= 1 || maxPosition <= 0) return 0;
    return (position / maxPosition) * ((1 - sizeRatio) / sizeRatio) * 100;
}

export function getKeyboardScrollPosition({
    axis,
    key,
    current,
    pageSize,
    maxPosition,
    direction,
    lineStep,
}: KeyboardScrollPositionOptions) {
    switch (key) {
        case 'ArrowLeft':
            return current + (axis === 'x' && direction === 'rtl' ? lineStep : -lineStep);
        case 'ArrowUp':
            return current - lineStep;
        case 'ArrowRight':
            return current + (axis === 'x' && direction === 'rtl' ? -lineStep : lineStep);
        case 'ArrowDown':
            return current + lineStep;
        case 'PageUp':
            return current - pageSize;
        case 'PageDown':
            return current + pageSize;
        case 'Home':
            return 0;
        case 'End':
            return maxPosition;
        default:
            return undefined;
    }
}

export function getWheelScrollDelta(
    axis: ScrollAxis,
    event: Pick<WheelEvent, 'deltaX' | 'deltaY'>,
    direction: ScrollDirection,
) {
    if (axis === 'y') return event.deltaY;
    if (!event.deltaX) return event.deltaY;
    return direction === 'rtl' ? -event.deltaX : event.deltaX;
}

export function applyFallbackScrollPosition(
    element: Pick<HTMLElement, 'scrollLeft' | 'scrollTop'>,
    options: Pick<ScrollToOptions, 'left' | 'top'>,
    mode: 'absolute' | 'relative',
) {
    const relative = mode === 'relative';

    if (options.left !== undefined) {
        element.scrollLeft = (relative ? element.scrollLeft : 0) + options.left;
    }
    if (options.top !== undefined) {
        element.scrollTop = (relative ? element.scrollTop : 0) + options.top;
    }
}

export function getPointerAxisCoordinate(
    axis: ScrollAxis,
    event: Pick<PointerEvent, 'clientX' | 'clientY'>,
) {
    return axis === 'x' ? event.clientX : event.clientY;
}
