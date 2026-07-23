import { onBeforeUnmount, ref, type ComputedRef } from 'vue';
import { getPointerId, isMatchingPointer } from '@/utils/dom/pointer';
import { clamp } from '@/utils/number';
import { createRafScheduler } from '@/utils/rafScheduler';
import { normalizeSliderValue, type SliderBounds } from './sliderModel';
import type { SliderOrientation } from './types';

interface UseSliderPointerPreviewOptions {
    enabled: () => boolean;
    disabled: () => boolean;
    orientation: () => SliderOrientation;
    bounds: ComputedRef<SliderBounds>;
    step: ComputedRef<number | 'any'>;
    initialValue: number;
    onStateChange: () => void;
}

interface PendingSliderPreview {
    clientX: number;
    clientY: number;
    track: HTMLElement;
}

function getPreviewRect(track: HTMLElement, vertical: boolean) {
    const travelRect = track
        .querySelector<HTMLElement>('.rp-slider__travel')
        ?.getBoundingClientRect();
    if (travelRect && (vertical ? travelRect.height > 0 : travelRect.width > 0)) {
        return travelRect;
    }

    return track.getBoundingClientRect();
}

export function useSliderPointerPreview(options: UseSliderPointerPreviewOptions) {
    const dragging = ref(false);
    const previewAvailable = ref(false);
    const previewValue = ref(options.initialValue);
    let dragView: Window | null = null;
    let dragPointerId: number | undefined;
    let dragTrack: HTMLElement | null = null;
    let pendingPreview: PendingSliderPreview | undefined;
    const previewScheduler = createRafScheduler(
        applyScheduledPreview,
        () => pendingPreview?.track.ownerDocument.defaultView,
    );

    function updateFromPointer(
        pointer: Pick<PointerEvent, 'clientX' | 'clientY'>,
        track: HTMLElement,
    ) {
        if (!options.enabled() || options.disabled()) return false;

        const vertical = options.orientation() === 'vertical';
        const rect = getPreviewRect(track, vertical);
        const length = vertical ? rect.height : rect.width;
        if (length <= 0) return false;

        const offset = vertical ? rect.bottom - pointer.clientY : pointer.clientX - rect.left;
        const ratio = clamp(offset / length, 0, 1);
        const bounds = options.bounds.value;
        const rawValue = bounds.min + ratio * (bounds.max - bounds.min);
        previewValue.value = normalizeSliderValue(
            rawValue,
            bounds.min,
            bounds.max,
            options.step.value,
        );
        previewAvailable.value = true;
        return true;
    }

    function applyScheduledPreview() {
        const pending = pendingPreview;
        pendingPreview = undefined;
        if (pending && updateFromPointer(pending, pending.track)) options.onStateChange();
    }

    function schedulePreview(event: PointerEvent, track: HTMLElement) {
        if (!options.enabled() || options.disabled()) return;

        pendingPreview = { clientX: event.clientX, clientY: event.clientY, track };
        previewScheduler.schedule();
    }

    function cancelScheduledPreview() {
        previewScheduler.cancel();
        pendingPreview = undefined;
    }

    function removeDragListeners() {
        dragView?.removeEventListener('pointermove', onWindowPointerMove);
        dragView?.removeEventListener('pointerup', onPointerEnd);
        dragView?.removeEventListener('pointercancel', onPointerEnd);
        dragView = null;
        dragPointerId = undefined;
        dragTrack = null;
    }

    function onPointerMove(event: PointerEvent) {
        if (dragging.value && !isMatchingPointer(event, dragPointerId)) return;

        const track = event.currentTarget as HTMLElement | null;
        if (track) schedulePreview(event, track);
    }

    function onWindowPointerMove(event: PointerEvent) {
        if (!isMatchingPointer(event, dragPointerId)) return;
        if (dragTrack) schedulePreview(event, dragTrack);
    }

    function onPointerEnd(event: PointerEvent) {
        if (!isMatchingPointer(event, dragPointerId)) return;

        cancelScheduledPreview();
        if (dragTrack) updateFromPointer(event, dragTrack);
        dragging.value = false;
        removeDragListeners();
        options.onStateChange();
    }

    function onPointerDown(event: PointerEvent) {
        if (options.disabled() || event.button !== 0 || event.isPrimary === false) return false;

        removeDragListeners();
        dragging.value = true;
        dragPointerId = getPointerId(event);
        dragTrack = event.currentTarget as HTMLElement | null;
        if (dragTrack) updateFromPointer(event, dragTrack);
        dragView = dragTrack?.ownerDocument.defaultView ?? null;
        dragView?.addEventListener('pointermove', onWindowPointerMove);
        dragView?.addEventListener('pointerup', onPointerEnd);
        dragView?.addEventListener('pointercancel', onPointerEnd);
        return true;
    }

    function onTrackEnter(event: PointerEvent) {
        if (!options.enabled()) return;

        cancelScheduledPreview();
        previewAvailable.value = false;
        const track = event.currentTarget as HTMLElement | null;
        if (track) updateFromPointer(event, track);
    }

    function onTrackLeave() {
        if (!dragging.value && options.enabled()) cancelScheduledPreview();
    }

    onBeforeUnmount(() => {
        removeDragListeners();
        cancelScheduledPreview();
    });

    return {
        dragging,
        previewAvailable,
        previewValue,
        onPointerDown,
        onPointerMove,
        onTrackEnter,
        onTrackLeave,
    };
}
