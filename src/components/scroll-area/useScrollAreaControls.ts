import type { Ref } from 'vue';
import {
    clamp,
    getRawHorizontalPosition,
    type ScrollAxis,
    type ScrollDirection,
} from './scrollAreaCore';
import type { ScrollAreaMetricsController } from './useScrollAreaMetrics';
import type { ScrollAreaPosition } from './types';

interface UseScrollAreaControlsOptions {
    viewportRef: Ref<HTMLElement | null>;
    metrics: ScrollAreaMetricsController;
    showDuringScroll: () => void;
    emitScroll: (event: Event) => void;
    emitPositionChange: (position: ScrollAreaPosition) => void;
    emitReachTop: (event: Event) => void;
    emitReachBottom: (event: Event) => void;
    emitReachLeft: (event: Event) => void;
    emitReachRight: (event: Event) => void;
}

export function useScrollAreaControls(options: UseScrollAreaControlsOptions) {
    let previousPosition: ScrollAreaPosition = { x: 0, y: 0 };

    function onViewportScroll(event: Event) {
        options.metrics.updatePosition();
        options.showDuringScroll();

        const position = {
            x: options.metrics.getPosition('x'),
            y: options.metrics.getPosition('y'),
        };
        const reachedBoundaries = getReachedBoundaries(position);
        previousPosition = position;

        options.emitScroll(event);
        options.emitPositionChange({
            x: options.metrics.metrics.x,
            y: options.metrics.metrics.y,
        });
        for (const boundary of reachedBoundaries) emitReachedBoundary(boundary, event);
    }

    function getReachedBoundaries(position: ScrollAreaPosition) {
        const boundaries: Array<'top' | 'bottom' | 'left' | 'right'> = [];

        if (options.metrics.getOverflow('y')) {
            const maxPosition = options.metrics.getMaxPosition('y');
            if (position.y <= 1 && previousPosition.y > 1) boundaries.push('top');
            if (position.y >= maxPosition - 1 && previousPosition.y < maxPosition - 1) {
                boundaries.push('bottom');
            }
        }

        if (options.metrics.getOverflow('x')) {
            const maxPosition = options.metrics.getMaxPosition('x');
            const reachedStart = position.x <= 1 && previousPosition.x > 1;
            const reachedEnd =
                position.x >= maxPosition - 1 && previousPosition.x < maxPosition - 1;

            if (reachedStart || reachedEnd) {
                const rtl = options.metrics.metrics.direction === 'rtl';

                if (reachedStart) boundaries.push(rtl ? 'right' : 'left');
                if (reachedEnd) boundaries.push(rtl ? 'left' : 'right');
            }
        }

        return boundaries;
    }

    function emitReachedBoundary(boundary: 'top' | 'bottom' | 'left' | 'right', event: Event) {
        switch (boundary) {
            case 'top':
                options.emitReachTop(event);
                break;
            case 'bottom':
                options.emitReachBottom(event);
                break;
            case 'left':
                options.emitReachLeft(event);
                break;
            case 'right':
                options.emitReachRight(event);
                break;
        }
    }

    function writeAxisPosition(axis: ScrollAxis, value: number) {
        const viewport = options.viewportRef.value;
        if (!viewport) return;

        if (axis === 'x') {
            viewport.scrollLeft = getRawHorizontalPosition(
                value,
                options.metrics.getMaxPosition('x'),
                options.metrics.metrics.direction,
            );
        } else {
            viewport.scrollTop = clamp(value, 0, options.metrics.getMaxPosition('y'));
        }

        options.metrics.updatePosition();
        options.showDuringScroll();
    }

    function onScrollbarKeydown(axis: ScrollAxis, event: KeyboardEvent) {
        const viewport = options.viewportRef.value;
        if (!viewport || !options.metrics.getOverflow(axis)) return;

        const current = options.metrics.getPosition(axis);
        const pageSize = axis === 'x' ? viewport.clientWidth : viewport.clientHeight;
        const nextPosition = getKeyboardPosition(
            axis,
            event.key,
            current,
            pageSize,
            options.metrics.getMaxPosition(axis),
            options.metrics.metrics.direction,
        );
        if (nextPosition === undefined) return;

        event.preventDefault();
        writeAxisPosition(axis, nextPosition);
    }

    function onScrollbarWheel(axis: ScrollAxis, event: WheelEvent) {
        if (!options.metrics.getOverflow(axis)) return;

        const delta = getWheelDelta(axis, event, options.metrics.metrics.direction);
        if (!delta) return;

        event.preventDefault();
        writeAxisPosition(axis, options.metrics.getPosition(axis) + delta);
    }

    function scrollTo(scrollOptions: ScrollToOptions) {
        const viewport = options.viewportRef.value;
        if (!viewport) return;

        if (typeof viewport.scrollTo === 'function') viewport.scrollTo(scrollOptions);
        else setFallbackPosition(viewport, scrollOptions, false);
        options.metrics.schedulePositionUpdate();
    }

    function scrollBy(scrollOptions: ScrollToOptions) {
        const viewport = options.viewportRef.value;
        if (!viewport) return;

        if (typeof viewport.scrollBy === 'function') viewport.scrollBy(scrollOptions);
        else setFallbackPosition(viewport, scrollOptions, true);
        options.metrics.schedulePositionUpdate();
    }

    return {
        onViewportScroll,
        onScrollbarKeydown,
        onScrollbarWheel,
        writeAxisPosition,
        scrollTo,
        scrollBy,
    };
}

function getKeyboardPosition(
    axis: ScrollAxis,
    key: string,
    current: number,
    pageSize: number,
    max: number,
    direction: ScrollDirection,
) {
    switch (key) {
        case 'ArrowLeft':
            return current + (axis === 'x' && direction === 'rtl' ? 40 : -40);
        case 'ArrowUp':
            return current - 40;
        case 'ArrowRight':
            return current + (axis === 'x' && direction === 'rtl' ? -40 : 40);
        case 'ArrowDown':
            return current + 40;
        case 'PageUp':
            return current - pageSize;
        case 'PageDown':
            return current + pageSize;
        case 'Home':
            return 0;
        case 'End':
            return max;
        default:
            return undefined;
    }
}

function getWheelDelta(axis: ScrollAxis, event: WheelEvent, direction: ScrollDirection) {
    if (axis === 'y') return event.deltaY;
    if (!event.deltaX) return event.deltaY;
    return direction === 'rtl' ? -event.deltaX : event.deltaX;
}

function setFallbackPosition(
    viewport: HTMLElement,
    scrollOptions: ScrollToOptions,
    relative: boolean,
) {
    if (scrollOptions.left !== undefined) {
        viewport.scrollLeft = (relative ? viewport.scrollLeft : 0) + scrollOptions.left;
    }
    if (scrollOptions.top !== undefined) {
        viewport.scrollTop = (relative ? viewport.scrollTop : 0) + scrollOptions.top;
    }
}

export type ScrollAreaControlsController = ReturnType<typeof useScrollAreaControls>;
