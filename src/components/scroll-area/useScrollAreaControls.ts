import type { Ref } from 'vue';
import { clamp, type ScrollAxis } from './scrollAreaCore';
import type { ScrollAreaMetricsController } from './useScrollAreaMetrics';
import type { ScrollAreaPosition } from './types';

interface UseScrollAreaControlsOptions {
    viewportRef: Ref<HTMLElement | null>;
    metrics: ScrollAreaMetricsController;
    showDuringScroll: () => void;
    emitScroll: (event: Event) => void;
    emitPositionChange: (position: ScrollAreaPosition) => void;
}

export function useScrollAreaControls(options: UseScrollAreaControlsOptions) {
    function onViewportScroll(event: Event) {
        options.metrics.update();
        options.showDuringScroll();
        options.emitScroll(event);
        options.emitPositionChange({
            x: options.metrics.metrics.x,
            y: options.metrics.metrics.y,
        });
    }

    function writeAxisPosition(axis: ScrollAxis, value: number) {
        const viewport = options.viewportRef.value;
        if (!viewport) return;

        if (axis === 'x') {
            const direction = viewport.scrollLeft < 0 ? -1 : 1;
            viewport.scrollLeft = direction * clamp(value, 0, options.metrics.getMaxPosition('x'));
        } else {
            viewport.scrollTop = clamp(value, 0, options.metrics.getMaxPosition('y'));
        }

        options.metrics.update();
        options.showDuringScroll();
    }

    function onScrollbarKeydown(axis: ScrollAxis, event: KeyboardEvent) {
        const viewport = options.viewportRef.value;
        if (!viewport || !options.metrics.getOverflow(axis)) return;

        const current = options.metrics.getPosition(axis);
        const pageSize = axis === 'x' ? viewport.clientWidth : viewport.clientHeight;
        const nextPosition = getKeyboardPosition(
            event.key,
            current,
            pageSize,
            options.metrics.getMaxPosition(axis),
        );
        if (nextPosition === undefined) return;

        event.preventDefault();
        writeAxisPosition(axis, nextPosition);
    }

    function onScrollbarWheel(axis: ScrollAxis, event: WheelEvent) {
        if (!options.metrics.getOverflow(axis)) return;

        const delta = axis === 'x' ? event.deltaX || event.deltaY : event.deltaY;
        if (!delta) return;

        event.preventDefault();
        writeAxisPosition(axis, options.metrics.getPosition(axis) + delta);
    }

    function scrollTo(scrollOptions: ScrollToOptions) {
        const viewport = options.viewportRef.value;
        if (!viewport) return;

        if (typeof viewport.scrollTo === 'function') viewport.scrollTo(scrollOptions);
        else setFallbackPosition(viewport, scrollOptions, false);
        options.metrics.scheduleUpdate();
    }

    function scrollBy(scrollOptions: ScrollToOptions) {
        const viewport = options.viewportRef.value;
        if (!viewport) return;

        if (typeof viewport.scrollBy === 'function') viewport.scrollBy(scrollOptions);
        else setFallbackPosition(viewport, scrollOptions, true);
        options.metrics.scheduleUpdate();
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

function getKeyboardPosition(key: string, current: number, pageSize: number, max: number) {
    switch (key) {
        case 'ArrowLeft':
        case 'ArrowUp':
            return current - 40;
        case 'ArrowRight':
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
