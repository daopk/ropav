import { onBeforeUnmount } from 'vue';
import type { RangeSliderThumb } from './types';

interface DragSession {
    view: Window | null;
    track: HTMLElement;
    thumb: RangeSliderThumb;
    anchorValue: number;
    pointerId: number | undefined;
}

interface UseRangeSliderPointerOptions {
    disabled: () => boolean;
    getPointerValue: (event: PointerEvent, track: HTMLElement) => number | undefined;
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

export function useRangeSliderPointer(options: UseRangeSliderPointerOptions) {
    let session: DragSession | undefined;

    function stopDragging() {
        const stoppedSession = session;
        if (!stoppedSession) return;

        stoppedSession.view?.removeEventListener('pointermove', onPointerMove);
        stoppedSession.view?.removeEventListener('pointerup', onPointerEnd);
        stoppedSession.view?.removeEventListener('pointercancel', onPointerEnd);
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

        const value = options.getPointerValue(event, currentSession.track);
        if (value == null) return;

        const nextThumb = options.updateThumb(
            currentSession.thumb,
            value,
            currentSession.anchorValue,
        );
        switchDraggingThumb(nextThumb);
    }

    function isCurrentPointer(event: PointerEvent) {
        return session?.pointerId === undefined || event.pointerId === session.pointerId;
    }

    function onPointerMove(event: PointerEvent) {
        if (!isCurrentPointer(event)) return;
        if (!session) return;

        updateFromPointer(event);
    }

    function onPointerEnd(event: PointerEvent) {
        if (!isCurrentPointer(event)) return;
        stopDragging();
    }

    function onTrackPointerDown(event: PointerEvent) {
        if (options.disabled() || event.button !== 0 || event.isPrimary === false) return;

        const track = event.currentTarget as HTMLElement | null;
        if (!track) return;

        const pointerValue = options.getPointerValue(event, track);
        if (pointerValue == null) return;

        const thumb = options.getThumb(event, pointerValue);
        event.preventDefault();
        stopDragging();
        options.setActiveThumb(thumb);
        options.focusThumb(track, thumb);

        session = {
            view: track.ownerDocument.defaultView,
            track,
            thumb,
            anchorValue: options.getAnchorValue(thumb),
            pointerId: Number.isFinite(event.pointerId) ? event.pointerId : undefined,
        };
        options.startDrag(thumb);
        updateFromPointer(event);

        const view = session?.view;
        view?.addEventListener('pointermove', onPointerMove);
        view?.addEventListener('pointerup', onPointerEnd);
        view?.addEventListener('pointercancel', onPointerEnd);
    }

    onBeforeUnmount(stopDragging);

    return { onTrackPointerDown };
}
