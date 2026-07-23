import { computed, nextTick, ref, watch } from 'vue';
import {
    applyFallbackScrollPosition,
    getKeyboardScrollPosition,
    getRawHorizontalScrollPosition,
    getWheelScrollDelta,
    type ScrollAxis,
} from '@/utils/dom/scroll';
import { clamp } from '@/utils/number';
import {
    getReachedScrollAreaBoundaries,
    getScrollAreaAxisPosition,
    getScrollAreaAxisState,
    getScrollAreaMaxPosition,
    getScrollAreaOverflow,
    isScrollAreaAxisEnabled,
    type ScrollBoundary,
} from './scrollAreaModel';
import type { ScrollAreaPosition, ScrollAreaProps, ScrollAreaSlotProps } from './types';
import { useScrollAreaAttributes } from './useScrollAreaAttributes';
import { useScrollAreaDerivedState } from './useScrollAreaDerivedState';
import { useScrollAreaMeasurement } from './useScrollAreaMeasurement';
import { useScrollAreaPointer } from './useScrollAreaPointer';
import { useScrollAreaVisibility } from './useScrollAreaVisibility';

interface ScrollAreaEmit {
    (event: 'scroll', value: Event): void;
    (event: 'scrollPositionChange', value: ScrollAreaPosition): void;
    (event: 'reachTop', value: Event): void;
    (event: 'reachBottom', value: Event): void;
    (event: 'reachLeft', value: Event): void;
    (event: 'reachRight', value: Event): void;
}

const minimumThumbSize = 18;
const keyboardScrollStep = 40;

export function useScrollArea(props: Readonly<ScrollAreaProps>, emit: ScrollAreaEmit) {
    const rootRef = ref<HTMLElement | null>(null);
    const viewportRef = ref<HTMLElement | null>(null);
    const contentRef = ref<HTMLElement | null>(null);
    const horizontalScrollbarRef = ref<HTMLElement | null>(null);
    const verticalScrollbarRef = ref<HTMLElement | null>(null);
    const templateRefs = {
        root: rootRef,
        viewport: viewportRef,
        content: contentRef,
        horizontalScrollbar: horizontalScrollbarRef,
        verticalScrollbar: verticalScrollbarRef,
    };
    const { metrics, schedulePositionUpdate, scheduleUpdate, update, updatePosition } =
        useScrollAreaMeasurement({
            elements: templateRefs,
            isAxisEnabled: (axis) => isScrollAreaAxisEnabled(props.scrollbars, axis),
            minimumThumbSize,
        });
    const {
        horizontalScrollbarActive,
        renderHorizontalScrollbar,
        renderVerticalScrollbar,
        verticalScrollbarActive,
    } = useScrollAreaDerivedState(props, metrics);
    const visibility = useScrollAreaVisibility({
        getHideDelay: () => props.scrollHideDelay,
        getType: () => props.type ?? 'hover',
        isScrollbarActive: (axis) =>
            axis === 'x' ? horizontalScrollbarActive.value : verticalScrollbarActive.value,
        root: rootRef,
    });
    const { onScrollbarPointerdown, onThumbPointerdown } = useScrollAreaPointer({
        elements: templateRefs,
        isEmbedded: () => Boolean(props.embedded),
        refreshAxis,
        setDraggingAxis: visibility.setDraggingAxis,
        writeAxisPosition,
    });
    let previousPosition: ScrollAreaPosition = { x: 0, y: 0 };

    const {
        contentAttrs,
        cornerAttrs,
        horizontalScrollbarAttrs,
        horizontalThumbAttrs,
        rootAttrs,
        verticalScrollbarAttrs,
        verticalThumbAttrs,
        viewportAttrs,
    } = useScrollAreaAttributes({
        metrics,
        onViewportScroll,
        props,
        rootHandlers: visibility.rootHandlers,
        state: {
            horizontalActive: horizontalScrollbarActive,
            horizontalVisible: visibility.horizontalVisible,
            verticalActive: verticalScrollbarActive,
            verticalVisible: visibility.verticalVisible,
        },
        viewport: viewportRef,
    });
    const slotProps = computed<ScrollAreaSlotProps>(() => ({
        position: { x: metrics.x, y: metrics.y },
        overflowX: metrics.overflowX,
        overflowY: metrics.overflowY,
        scrollTo,
        scrollBy,
        update,
    }));

    function refreshAxis(axis: ScrollAxis) {
        updatePosition();
        return getScrollAreaAxisState(metrics, axis);
    }

    function onViewportScroll(event: Event) {
        updatePosition();
        visibility.showDuringScroll();

        const position = {
            x: getScrollAreaAxisPosition(metrics, 'x'),
            y: getScrollAreaAxisPosition(metrics, 'y'),
        };
        const reachedBoundaries = getReachedScrollAreaBoundaries(
            position,
            previousPosition,
            metrics,
        );
        previousPosition = position;

        emit('scroll', event);
        emit('scrollPositionChange', { x: metrics.x, y: metrics.y });
        for (const boundary of reachedBoundaries) {
            emitReachedBoundary(boundary, event);
        }
    }

    function emitReachedBoundary(boundary: ScrollBoundary, event: Event) {
        switch (boundary) {
            case 'top':
                emit('reachTop', event);
                break;
            case 'bottom':
                emit('reachBottom', event);
                break;
            case 'left':
                emit('reachLeft', event);
                break;
            case 'right':
                emit('reachRight', event);
                break;
        }
    }

    function writeAxisPosition(axis: ScrollAxis, value: number) {
        const viewport = viewportRef.value;
        if (!viewport) return;

        if (axis === 'x') {
            viewport.scrollLeft = getRawHorizontalScrollPosition(
                value,
                getScrollAreaMaxPosition(metrics, 'x'),
                metrics.direction,
            );
        } else {
            viewport.scrollTop = clamp(value, 0, getScrollAreaMaxPosition(metrics, 'y'));
        }

        updatePosition();
        visibility.showDuringScroll();
    }

    function onScrollbarKeydown(axis: ScrollAxis, event: KeyboardEvent) {
        const viewport = viewportRef.value;
        if (!viewport || !getScrollAreaOverflow(metrics, axis)) return;

        updatePosition(viewport);
        const current = getScrollAreaAxisPosition(metrics, axis);
        const pageSize = axis === 'x' ? viewport.clientWidth : viewport.clientHeight;
        const nextPosition = getKeyboardScrollPosition({
            axis,
            key: event.key,
            current,
            pageSize,
            maxPosition: getScrollAreaMaxPosition(metrics, axis),
            direction: metrics.direction,
            lineStep: keyboardScrollStep,
        });
        if (nextPosition === undefined) return;

        event.preventDefault();
        writeAxisPosition(axis, nextPosition);
    }

    function onScrollbarWheel(axis: ScrollAxis, event: WheelEvent) {
        if (!getScrollAreaOverflow(metrics, axis)) return;

        updatePosition();
        const delta = getWheelScrollDelta(axis, event, metrics.direction);
        if (!delta) return;

        event.preventDefault();
        writeAxisPosition(axis, getScrollAreaAxisPosition(metrics, axis) + delta);
    }

    function scrollTo(scrollOptions: ScrollToOptions) {
        const viewport = viewportRef.value;
        if (!viewport) return;

        if (typeof viewport.scrollTo === 'function') {
            viewport.scrollTo(scrollOptions);
        } else {
            applyFallbackScrollPosition(viewport, scrollOptions, 'absolute');
        }
        schedulePositionUpdate();
    }

    function scrollBy(scrollOptions: ScrollToOptions) {
        const viewport = viewportRef.value;
        if (!viewport) return;

        if (typeof viewport.scrollBy === 'function') {
            viewport.scrollBy(scrollOptions);
        } else {
            applyFallbackScrollPosition(viewport, scrollOptions, 'relative');
        }
        schedulePositionUpdate();
    }

    watch(
        [
            horizontalScrollbarActive,
            verticalScrollbarActive,
            renderHorizontalScrollbar,
            renderVerticalScrollbar,
        ],
        () => void nextTick(scheduleUpdate),
    );

    return {
        templateRefs,
        renderHorizontalScrollbar,
        renderVerticalScrollbar,
        rootAttrs,
        viewportAttrs,
        contentAttrs,
        horizontalScrollbarAttrs,
        verticalScrollbarAttrs,
        horizontalThumbAttrs,
        verticalThumbAttrs,
        cornerAttrs,
        slotProps,
        onScrollbarKeydown,
        onScrollbarWheel,
        onScrollbarPointerdown,
        onThumbPointerdown,
        scrollTo,
        scrollBy,
        update,
    };
}
