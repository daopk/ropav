import { onBeforeUnmount } from 'vue';
import { getPointerId, isMatchingPointer } from '@/utils/dom/pointer';
import { createRafScheduler } from '@/utils/rafScheduler';
import type { RangeSliderThumb } from './types';

interface DragSession<TGeometry> {
    view: Window | null;
    track: HTMLElement;
    geometry: TGeometry;
    thumb: RangeSliderThumb;
    anchorValue: number;
    pointerId: number | undefined;
}

interface UseRangeSliderPointerOptions<TGeometry> {
    disabled: () => boolean;
    getPointerGeometry: (track: HTMLElement) => TGeometry | undefined;
    getPointerValue: (event: PointerEvent, geometry: TGeometry) => number | undefined;
    getThumb: (event: PointerEvent, value: number) => RangeSliderThumb;
    getAnchorValue: (thumb: RangeSliderThumb) => number;
    setActiveThumb: (thumb: RangeSliderThumb) => void;
    focusThumb: (track: HTMLElement, thumb: RangeSliderThumb) => void;
    updateThumb: (thumb: RangeSliderThumb, value: number, anchorValue: number) => RangeSliderThumb;
    transferFocusedThumb: (
        track: HTMLElement,
        from: RangeSliderThumb,
        to: RangeSliderThumb,
    ) => void;
    startDrag: (thumb: RangeSliderThumb) => void;
    endDrag: (thumb: RangeSliderThumb) => void;
    transferDrag: (from: RangeSliderThumb, to: RangeSliderThumb) => void;
}

export function useRangeSliderPointer<TGeometry>(options: UseRangeSliderPointerOptions<TGeometry>) {
    let session: DragSession<TGeometry> | undefined;
    let pendingPointerEvent: PointerEvent | undefined;
    let geometryDirty = false;

    function refreshGeometry() {
        const currentSession = session;
        if (!currentSession) return false;
        if (!geometryDirty) return true;

        const geometry = options.getPointerGeometry(currentSession.track);
        if (geometry === undefined) return false;

        geometryDirty = false;
        currentSession.geometry = geometry;
        return true;
    }

    function applyScheduledUpdate() {
        if (!refreshGeometry()) return;

        const event = pendingPointerEvent;
        pendingPointerEvent = undefined;
        if (event && isCurrentPointer(event)) updateFromPointer(event);
    }

    const updateScheduler = createRafScheduler(applyScheduledUpdate, () => session?.view);

    function flushScheduledUpdate() {
        updateScheduler.cancel();
        applyScheduledUpdate();
    }

    function scheduleUpdate() {
        if (session) updateScheduler.schedule();
    }

    function onGeometryChange() {
        if (!session) return;
        geometryDirty = true;
        scheduleUpdate();
    }

    function stopDragging() {
        const stoppedSession = session;
        if (!stoppedSession) return;

        stoppedSession.view?.removeEventListener('pointermove', onPointerMove);
        stoppedSession.view?.removeEventListener('pointerup', onPointerEnd);
        stoppedSession.view?.removeEventListener('pointercancel', onPointerEnd);
        stoppedSession.view?.removeEventListener('resize', onGeometryChange);
        stoppedSession.view?.removeEventListener('scroll', onGeometryChange, true);
        updateScheduler.cancel();
        pendingPointerEvent = undefined;
        geometryDirty = false;
        session = undefined;
        options.endDrag(stoppedSession.thumb);
    }

    function switchDraggingThumb(nextThumb: RangeSliderThumb) {
        const currentSession = session;
        if (!currentSession || currentSession.thumb === nextThumb) return;

        const previousThumb = currentSession.thumb;
        currentSession.thumb = nextThumb;
        options.transferDrag(previousThumb, nextThumb);
        options.setActiveThumb(nextThumb);
        options.transferFocusedThumb(currentSession.track, previousThumb, nextThumb);
    }

    function updateFromPointer(event: PointerEvent) {
        const currentSession = session;
        if (!currentSession) return;

        const value = options.getPointerValue(event, currentSession.geometry);
        if (value == null) return;

        const nextThumb = options.updateThumb(
            currentSession.thumb,
            value,
            currentSession.anchorValue,
        );
        switchDraggingThumb(nextThumb);
    }

    function isCurrentPointer(event: PointerEvent) {
        return isMatchingPointer(event, session?.pointerId);
    }

    function onPointerMove(event: PointerEvent) {
        if (!isCurrentPointer(event)) return;
        if (!session) return;

        pendingPointerEvent = event;
        scheduleUpdate();
    }

    function onPointerEnd(event: PointerEvent) {
        if (!isCurrentPointer(event)) return;
        if (event.type === 'pointerup') flushScheduledUpdate();
        stopDragging();
    }

    function onTrackPointerDown(event: PointerEvent) {
        if (options.disabled() || event.button !== 0 || event.isPrimary === false) return;

        const track = event.currentTarget as HTMLElement | null;
        if (!track) return;

        const geometry = options.getPointerGeometry(track);
        if (geometry === undefined) return;

        const pointerValue = options.getPointerValue(event, geometry);
        if (pointerValue == null) return;

        const thumb = options.getThumb(event, pointerValue);
        event.preventDefault();
        stopDragging();
        options.setActiveThumb(thumb);
        options.focusThumb(track, thumb);

        session = {
            view: track.ownerDocument.defaultView,
            track,
            geometry,
            thumb,
            anchorValue: options.getAnchorValue(thumb),
            pointerId: getPointerId(event),
        };
        options.startDrag(thumb);
        const nextThumb = options.updateThumb(thumb, pointerValue, session.anchorValue);
        switchDraggingThumb(nextThumb);

        const view = session?.view;
        view?.addEventListener('pointermove', onPointerMove);
        view?.addEventListener('pointerup', onPointerEnd);
        view?.addEventListener('pointercancel', onPointerEnd);
        view?.addEventListener('resize', onGeometryChange);
        view?.addEventListener('scroll', onGeometryChange, true);
    }

    onBeforeUnmount(stopDragging);

    return { onTrackPointerDown };
}
