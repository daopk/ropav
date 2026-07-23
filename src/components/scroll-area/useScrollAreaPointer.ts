import { onBeforeUnmount, type Ref } from 'vue';
import { getPointerId, isMatchingPointer } from '@/utils/dom/pointer';
import { getPointerAxisCoordinate, type ScrollAxis } from '@/utils/dom/scroll';
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
    pointerId: number | undefined;
    startCoordinate: number;
    startPosition: number;
    travel: number;
    view: Window | null;
}

export function useScrollAreaPointer(options: UseScrollAreaPointerOptions) {
    let dragSession: DragSession | undefined;

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
        if (event.button !== 0 || event.isPrimary === false) return;

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

        event.preventDefault();
        stopDragging();
        if (!options.isEmbedded()) scrollbar.focus({ preventScroll: true });
        startDragging(axis, event, scrollbar, travel, state);
    }

    function startDragging(
        axis: ScrollAxis,
        event: PointerEvent,
        scrollbar: HTMLElement,
        travel: number,
        state: ScrollAreaAxisState,
    ) {
        const view = scrollbar.ownerDocument.defaultView;
        dragSession = {
            axis,
            coordinateDirection: axis === 'x' && state.direction === 'rtl' ? -1 : 1,
            maxPosition: state.maxPosition,
            pointerId: getPointerId(event),
            startCoordinate: getPointerAxisCoordinate(axis, event),
            startPosition: state.position,
            travel,
            view,
        };
        options.setDraggingAxis(axis);
        view?.addEventListener('pointermove', onPointermove);
        view?.addEventListener('pointerup', onPointerend);
        view?.addEventListener('pointercancel', onPointerend);
    }

    function onPointermove(event: PointerEvent) {
        const session = dragSession;
        if (!session || !isMatchingPointer(event, session.pointerId)) return;

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
    }

    function onPointerend(event: PointerEvent) {
        if (!dragSession || !isMatchingPointer(event, dragSession.pointerId)) return;
        stopDragging();
    }

    function stopDragging() {
        const view = dragSession?.view;
        view?.removeEventListener('pointermove', onPointermove);
        view?.removeEventListener('pointerup', onPointerend);
        view?.removeEventListener('pointercancel', onPointerend);
        dragSession = undefined;
        options.setDraggingAxis(null);
    }

    function getScrollbar(axis: ScrollAxis) {
        return axis === 'x'
            ? options.elements.horizontalScrollbar.value
            : options.elements.verticalScrollbar.value;
    }

    onBeforeUnmount(stopDragging);

    return { onScrollbarPointerdown, onThumbPointerdown };
}
