import { computed, nextTick, ref, watch } from 'vue';
import { isAxisEnabled } from './scrollAreaModel';
import { useScrollAreaControls } from './useScrollAreaControls';
import { useScrollAreaMetrics } from './useScrollAreaMetrics';
import { useScrollAreaPointer } from './useScrollAreaPointer';
import { useScrollAreaVisibility } from './useScrollAreaVisibility';
import type { ScrollAreaPosition, ScrollAreaProps } from './types';

interface UseScrollAreaOptions {
    props: Readonly<ScrollAreaProps>;
    emitScroll: (event: Event) => void;
    emitPositionChange: (position: ScrollAreaPosition) => void;
    emitReachTop: (event: Event) => void;
    emitReachBottom: (event: Event) => void;
    emitReachLeft: (event: Event) => void;
    emitReachRight: (event: Event) => void;
}

export function useScrollArea(options: UseScrollAreaOptions) {
    const rootRef = ref<HTMLElement | null>(null);
    const viewportRef = ref<HTMLElement | null>(null);
    const contentRef = ref<HTMLElement | null>(null);
    const horizontalScrollbarRef = ref<HTMLElement | null>(null);
    const verticalScrollbarRef = ref<HTMLElement | null>(null);

    const horizontalEnabled = computed(() => isAxisEnabled(options.props.scrollbars, 'x'));
    const verticalEnabled = computed(() => isAxisEnabled(options.props.scrollbars, 'y'));

    const measurements = useScrollAreaMetrics({
        viewportRef,
        contentRef,
        horizontalScrollbarRef,
        verticalScrollbarRef,
        horizontalEnabled,
        verticalEnabled,
    });
    const visibility = useScrollAreaVisibility({
        props: options.props,
        rootRef,
        horizontalEnabled,
        verticalEnabled,
        overflowX: () => measurements.metrics.overflowX,
        overflowY: () => measurements.metrics.overflowY,
    });
    const controls = useScrollAreaControls({
        viewportRef,
        metrics: measurements,
        showDuringScroll: visibility.showDuringScroll,
        emitScroll: options.emitScroll,
        emitPositionChange: options.emitPositionChange,
        emitReachTop: options.emitReachTop,
        emitReachBottom: options.emitReachBottom,
        emitReachLeft: options.emitReachLeft,
        emitReachRight: options.emitReachRight,
    });
    const pointer = useScrollAreaPointer({
        horizontalScrollbarRef,
        verticalScrollbarRef,
        metrics: measurements,
        controls,
        setDraggingAxis: visibility.setDraggingAxis,
        shouldFocusScrollbar: () => !options.props.embedded,
    });

    watch(
        [
            visibility.horizontalScrollbarActive,
            visibility.verticalScrollbarActive,
            visibility.renderHorizontalScrollbar,
            visibility.renderVerticalScrollbar,
        ],
        () => void nextTick(measurements.scheduleUpdate),
    );

    return {
        rootRef,
        viewportRef,
        contentRef,
        horizontalScrollbarRef,
        verticalScrollbarRef,
        metrics: measurements.metrics,
        position: measurements.position,
        update: measurements.update,
        getPosition: measurements.getPosition,
        getMaxPosition: measurements.getMaxPosition,
        getOverflow: measurements.getOverflow,
        ...visibility,
        ...controls,
        ...pointer,
    };
}

export type ScrollAreaController = ReturnType<typeof useScrollArea>;
