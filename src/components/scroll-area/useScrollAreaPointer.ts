import { onBeforeUnmount, type Ref } from 'vue';
import { clamp, type ScrollAxis } from './scrollAreaCore';
import type { ScrollAreaControlsController } from './useScrollAreaControls';
import type { ScrollAreaMetricsController } from './useScrollAreaMetrics';

interface DragSession {
    axis: ScrollAxis;
    pointerId: number | undefined;
    startCoordinate: number;
    startPosition: number;
    maxPosition: number;
    travel: number;
    view: Window | null;
}

interface UseScrollAreaPointerOptions {
    horizontalScrollbarRef: Ref<HTMLElement | null>;
    verticalScrollbarRef: Ref<HTMLElement | null>;
    metrics: ScrollAreaMetricsController;
    controls: ScrollAreaControlsController;
    setDraggingAxis: (axis: ScrollAxis | null) => void;
    shouldFocusScrollbar: () => boolean;
}

export function useScrollAreaPointer(options: UseScrollAreaPointerOptions) {
    let dragSession: DragSession | undefined;

    function onScrollbarPointerdown(axis: ScrollAxis, event: PointerEvent) {
        if (event.target !== event.currentTarget || event.button !== 0) return;
        if (!options.metrics.getOverflow(axis)) return;

        const scrollbar = event.currentTarget as HTMLElement;
        const thumb = scrollbar.firstElementChild as HTMLElement | null;
        const trackRect = scrollbar.getBoundingClientRect();
        const thumbRect = thumb?.getBoundingClientRect();
        const trackStart = axis === 'x' ? trackRect.left : trackRect.top;
        const trackSize = axis === 'x' ? trackRect.width : trackRect.height;
        const thumbSize = thumbRect ? (axis === 'x' ? thumbRect.width : thumbRect.height) : 0;
        const coordinate = getPointerCoordinate(axis, event);
        const travel = Math.max(0, trackSize - thumbSize);
        if (travel === 0) return;

        event.preventDefault();
        const ratio = clamp((coordinate - trackStart - thumbSize / 2) / travel, 0, 1);
        options.controls.writeAxisPosition(axis, ratio * options.metrics.getMaxPosition(axis));
    }

    function onThumbPointerdown(axis: ScrollAxis, event: PointerEvent) {
        if (event.button !== 0 || event.isPrimary === false) return;
        if (!options.metrics.getOverflow(axis)) return;

        const scrollbar = getScrollbar(axis);
        const thumb = event.currentTarget as HTMLElement;
        if (!scrollbar) return;

        const trackRect = scrollbar.getBoundingClientRect();
        const thumbRect = thumb.getBoundingClientRect();
        const trackSize = axis === 'x' ? trackRect.width : trackRect.height;
        const thumbSize = axis === 'x' ? thumbRect.width : thumbRect.height;
        const travel = Math.max(0, trackSize - thumbSize);
        if (travel === 0) return;

        event.preventDefault();
        event.stopPropagation();
        stopDragging();
        if (options.shouldFocusScrollbar()) scrollbar.focus({ preventScroll: true });
        startDragging(axis, event, scrollbar, travel);
    }

    function startDragging(
        axis: ScrollAxis,
        event: PointerEvent,
        scrollbar: HTMLElement,
        travel: number,
    ) {
        const view = scrollbar.ownerDocument.defaultView;
        dragSession = {
            axis,
            pointerId: Number.isFinite(event.pointerId) ? event.pointerId : undefined,
            startCoordinate: getPointerCoordinate(axis, event),
            startPosition: options.metrics.getPosition(axis),
            maxPosition: options.metrics.getMaxPosition(axis),
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
        if (!session || !isCurrentPointer(event, session)) return;

        const delta = getPointerCoordinate(session.axis, event) - session.startCoordinate;
        options.controls.writeAxisPosition(
            session.axis,
            session.startPosition + (delta / session.travel) * session.maxPosition,
        );
    }

    function onPointerend(event: PointerEvent) {
        if (!dragSession || !isCurrentPointer(event, dragSession)) return;
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
            ? options.horizontalScrollbarRef.value
            : options.verticalScrollbarRef.value;
    }

    onBeforeUnmount(stopDragging);

    return { onScrollbarPointerdown, onThumbPointerdown };
}

function getPointerCoordinate(axis: ScrollAxis, event: PointerEvent) {
    return axis === 'x' ? event.clientX : event.clientY;
}

function isCurrentPointer(event: PointerEvent, session: DragSession) {
    return session.pointerId === undefined || event.pointerId === session.pointerId;
}
