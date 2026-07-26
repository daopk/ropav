import { onBeforeUnmount, type ComputedRef, type Ref } from 'vue';
import { createPointerSession } from '@/utils/dom/pointerSession';
import { clamp } from '@/utils/number';
import { normalizeSliderValue, type SliderBounds } from './sliderModel';
import type { SliderOrientation } from './types';

interface SliderPointerGeometry {
    length: number;
    start: number;
    vertical: boolean;
}

interface SliderPointerSession {
    geometry: SliderPointerGeometry;
    track: HTMLElement;
}

interface UseSliderPointerOptions {
    bounds: ComputedRef<SliderBounds>;
    disabled: () => boolean;
    inputRef: Ref<HTMLInputElement | null>;
    orientation: () => SliderOrientation;
    step: ComputedRef<number | 'any'>;
    updateValue: (value: number) => void;
}

function readPointerGeometry(track: HTMLElement, orientation: SliderOrientation) {
    const vertical = orientation === 'vertical';
    const thumbTravelRect = track
        .querySelector<HTMLElement>('.rp-slider__thumb')
        ?.getBoundingClientRect();
    const rect =
        thumbTravelRect && (vertical ? thumbTravelRect.height > 0 : thumbTravelRect.width > 0)
            ? thumbTravelRect
            : track.getBoundingClientRect();
    const length = vertical ? rect.height : rect.width;
    if (length <= 0) return;

    return {
        length,
        start: vertical ? rect.bottom : rect.left,
        vertical,
    };
}

function getPointerValue(
    event: PointerEvent,
    geometry: SliderPointerGeometry,
    bounds: SliderBounds,
    step: number | 'any',
) {
    const pointerPosition = geometry.vertical ? event.clientY : event.clientX;
    const offset = geometry.vertical
        ? geometry.start - pointerPosition
        : pointerPosition - geometry.start;
    const ratio = clamp(offset / geometry.length, 0, 1);
    const rawValue = bounds.min + ratio * (bounds.max - bounds.min);

    return normalizeSliderValue(rawValue, bounds.min, bounds.max, step);
}

export function useSliderPointer(options: UseSliderPointerOptions) {
    function refreshGeometry(currentSession: SliderPointerSession) {
        const geometry = readPointerGeometry(currentSession.track, options.orientation());
        if (!geometry) return false;

        currentSession.geometry = geometry;
        return true;
    }

    function updateFromPointer(event: PointerEvent, currentSession: SliderPointerSession) {
        options.updateValue(
            getPointerValue(
                event,
                currentSession.geometry,
                options.bounds.value,
                options.step.value,
            ),
        );
    }

    const pointerSession = createPointerSession<SliderPointerSession>({
        onStart(event, currentSession) {
            event.preventDefault();
            options.inputRef.value?.focus({ preventScroll: true });
            updateFromPointer(event, currentSession);
        },
        onUpdate: updateFromPointer,
        refreshGeometry,
    });

    function onPointerDown(event: PointerEvent) {
        return pointerSession.start(event, () => {
            if (options.disabled()) return;

            const track = event.currentTarget as HTMLElement | null;
            if (!track) return;

            const geometry = readPointerGeometry(track, options.orientation());
            if (!geometry) return;

            return {
                state: { geometry, track },
                target: track,
            };
        });
    }

    onBeforeUnmount(pointerSession.stop);

    return { onPointerDown };
}
