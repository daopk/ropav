import { onBeforeUnmount, type Ref } from 'vue';
import { getPointerAxisCoordinate, type ScrollAxis } from '@/utils/dom/scroll';
import { createPointerSession } from '@/utils/dom/pointerSession';
import {
    getScrollAreaDragPosition,
    getScrollAreaTrackPosition,
    type ScrollAreaAxisState,
} from './scrollAreaModel';

interface ScrollAreaPointerElements {
    horizontalScrollbar: Ref<HTMLElement | null>;
    verticalScrollbar: Ref<HTMLElement | null>;
}

interface UseScrollAreaPointerOptions {
    elements: ScrollAreaPointerElements;
    isEmbedded: () => boolean;
    refreshAxis: (axis: ScrollAxis) => ScrollAreaAxisState;
    setDraggingAxis: (axis: ScrollAxis | null) => void;
    writeAxisPosition: (axis: ScrollAxis, position: number) => void;
}

interface DragSession {
    axis: ScrollAxis;
    coordinateDirection: 1 | -1;
    maxPosition: number;
    scrollbar: HTMLElement;
    startCoordinate: number;
    startPosition: number;
    travel: number;
}

export function useScrollAreaPointer(options: UseScrollAreaPointerOptions) {
    function onScrollbarPointerdown(axis: ScrollAxis, event: PointerEvent) {
        if (event.target !== event.currentTarget || event.button !== 0) return;

        const state = options.refreshAxis(axis);
        if (!state.overflow) return;

        const scrollbar = event.currentTarget as HTMLElement;
        const thumb = scrollbar.firstElementChild as HTMLElement | null;
        const trackRect = scrollbar.getBoundingClientRect();
        const thumbRect = thumb?.getBoundingClientRect();
        const horizontal = axis === 'x';
        const position = getScrollAreaTrackPosition({
            axis,
            coordinate: getPointerAxisCoordinate(axis, event),
            direction: state.direction,
            maxPosition: state.maxPosition,
            thumbSize: thumbRect ? (horizontal ? thumbRect.width : thumbRect.height) : 0,
            trackSize: horizontal ? trackRect.width : trackRect.height,
            trackStart: horizontal ? trackRect.left : trackRect.top,
        });
        if (position === undefined) return;

        event.preventDefault();
        options.writeAxisPosition(axis, position);
    }

    function onThumbPointerdown(axis: ScrollAxis, event: PointerEvent) {
        return pointerSession.start(event, () => {
            const state = options.refreshAxis(axis);
            if (!state.overflow) return;

            const scrollbar = getScrollbar(axis);
            const thumb = event.currentTarget as HTMLElement;
            if (!scrollbar) return;

            const trackRect = scrollbar.getBoundingClientRect();
            const thumbRect = thumb.getBoundingClientRect();
            const horizontal = axis === 'x';
            const trackSize = horizontal ? trackRect.width : trackRect.height;
            const thumbSize = horizontal ? thumbRect.width : thumbRect.height;
            const travel = Math.max(0, trackSize - thumbSize);
            if (travel === 0) return;

            return {
                state: {
                    axis,
                    coordinateDirection: axis === 'x' && state.direction === 'rtl' ? -1 : 1,
                    maxPosition: state.maxPosition,
                    scrollbar,
                    startCoordinate: getPointerAxisCoordinate(axis, event),
                    startPosition: state.position,
                    travel,
                },
                target: scrollbar,
            };
        });
    }

    function getScrollbar(axis: ScrollAxis) {
        return axis === 'x'
            ? options.elements.horizontalScrollbar.value
            : options.elements.verticalScrollbar.value;
    }

    const pointerSession = createPointerSession<DragSession>({
        endUpdate: 'none',
        onStart(event, session) {
            event.preventDefault();
            if (!options.isEmbedded()) session.scrollbar.focus({ preventScroll: true });
            options.setDraggingAxis(session.axis);
        },
        onStop() {
            options.setDraggingAxis(null);
        },
        onUpdate(event, session) {
            options.writeAxisPosition(
                session.axis,
                getScrollAreaDragPosition({
                    coordinate: getPointerAxisCoordinate(session.axis, event),
                    coordinateDirection: session.coordinateDirection,
                    maxPosition: session.maxPosition,
                    startCoordinate: session.startCoordinate,
                    startPosition: session.startPosition,
                    travel: session.travel,
                }),
            );
        },
        updateMode: 'immediate',
    });

    onBeforeUnmount(pointerSession.stop);

    return { onScrollbarPointerdown, onThumbPointerdown };
}
