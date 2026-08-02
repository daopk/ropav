import { onBeforeUnmount } from 'vue';
import { createPointerSession } from '@/utils/dom/pointerSession';
import type { RangeSliderThumb } from './types';

interface DragSession<TGeometry> {
    track: HTMLElement;
    geometry: TGeometry;
    thumb: RangeSliderThumb;
    anchorValue: number;
    initialValue: number;
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
    function refreshGeometry(currentSession: DragSession<TGeometry>) {
        const geometry = options.getPointerGeometry(currentSession.track);
        if (geometry === undefined) return false;

        currentSession.geometry = geometry;
        return true;
    }

    function switchDraggingThumb(
        currentSession: DragSession<TGeometry>,
        nextThumb: RangeSliderThumb,
    ) {
        if (currentSession.thumb === nextThumb) return;

        const previousThumb = currentSession.thumb;
        currentSession.thumb = nextThumb;
        options.transferDrag(previousThumb, nextThumb);
        options.setActiveThumb(nextThumb);
        options.transferFocusedThumb(currentSession.track, previousThumb, nextThumb);
    }

    function updateFromPointer(event: PointerEvent, currentSession: DragSession<TGeometry>) {
        const value = options.getPointerValue(event, currentSession.geometry);
        if (value == null) return;

        const nextThumb = options.updateThumb(
            currentSession.thumb,
            value,
            currentSession.anchorValue,
        );
        switchDraggingThumb(currentSession, nextThumb);
    }

    const pointerSession = createPointerSession<DragSession<TGeometry>>({
        onStart(event, currentSession) {
            event.preventDefault();
            options.setActiveThumb(currentSession.thumb);
            options.focusThumb(currentSession.track, currentSession.thumb);
            options.startDrag(currentSession.thumb);
            const nextThumb = options.updateThumb(
                currentSession.thumb,
                currentSession.initialValue,
                currentSession.anchorValue,
            );
            switchDraggingThumb(currentSession, nextThumb);
        },
        onStop(currentSession) {
            options.endDrag(currentSession.thumb);
        },
        onUpdate: updateFromPointer,
        refreshGeometry,
    });

    function onTrackPointerDown(event: PointerEvent) {
        return pointerSession.start(event, () => {
            if (options.disabled()) return;

            const track = event.currentTarget as HTMLElement | null;
            if (!track) return;

            const geometry = options.getPointerGeometry(track);
            if (geometry === undefined) return;

            const initialValue = options.getPointerValue(event, geometry);
            if (initialValue == null) return;

            const thumb = options.getThumb(event, initialValue);
            return {
                state: {
                    anchorValue: options.getAnchorValue(thumb),
                    geometry,
                    initialValue,
                    thumb,
                    track,
                },
                target: track,
            };
        });
    }

    onBeforeUnmount(pointerSession.stop);

    return { onTrackPointerDown };
}
