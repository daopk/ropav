import { onBeforeUnmount, ref, type ComputedRef } from 'vue';
import { createPointerSession } from '@/utils/dom/pointerSession';
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
    let disposing = false;
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

    const pointerSession = createPointerSession<HTMLElement>({
        endUpdate: 'event',
        onStart(event, track) {
            cancelScheduledPreview();
            dragging.value = true;
            updateFromPointer(event, track);
        },
        onStop() {
            dragging.value = false;
            if (!disposing) options.onStateChange();
        },
        onUpdate(event, track) {
            const updated = updateFromPointer(event, track);
            if (updated && event.type === 'pointermove') options.onStateChange();
        },
    });

    function onPointerMove(event: PointerEvent) {
        if (dragging.value) return;

        const track = event.currentTarget as HTMLElement | null;
        if (track) schedulePreview(event, track);
    }

    function onPointerDown(event: PointerEvent) {
        return pointerSession.start(event, () => {
            if (options.disabled()) return;

            const track = event.currentTarget as HTMLElement | null;
            if (!track) return;

            return { state: track, target: track };
        });
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
        disposing = true;
        pointerSession.stop();
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
