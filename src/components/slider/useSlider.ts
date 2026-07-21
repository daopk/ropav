import { computed, onBeforeUnmount, ref, type CSSProperties } from 'vue';
import { useDelayedOpen } from '@/internal/composables/useDelayedOpen';
import { useControlState } from '@/internal/composables/useControlState';
import { bem } from '@/utils/bem';
import { getComponentColorValue } from '@/utils/componentColors';
import {
    applySliderThumbStyle,
    createSliderMarkItems,
    getFormattedSliderValue,
    getSliderAriaValueText,
    getSliderThumbMode,
    getSliderThumbOptions,
    getSliderTooltipAnchor,
    getSliderTooltipMode,
    getSliderTooltipOptions,
    getSliderValuePercent,
    normalizeSliderBounds,
    normalizeSliderStep,
    normalizeSliderValue,
    setSliderStyleValue,
} from './sliderCore';
import type { SliderProps, SliderTrackSlotProps } from './types';

export {
    getSliderValuePercent,
    normalizeSliderBounds,
    normalizeSliderStep,
    normalizeSliderValue,
} from './sliderCore';

type SliderStateProps = Readonly<
    SliderProps & {
        min: number;
        max: number;
        step: number | 'any';
        tooltip: NonNullable<SliderProps['tooltip']>;
        thumb: NonNullable<SliderProps['thumb']>;
        orientation: NonNullable<SliderProps['orientation']>;
    }
>;

function getSliderColorValue(color: SliderProps['color']) {
    return getComponentColorValue(color);
}

function getSliderTrackStyle(
    props: SliderStateProps,
    valuePercent: number,
    tooltipPercent: number,
) {
    const style: CSSProperties = {
        '--_rp-slider-percent': `${valuePercent}%`,
        '--_rp-slider-ratio': `${valuePercent / 100}`,
        '--_rp-slider-tooltip-percent': `${tooltipPercent}%`,
        '--_rp-slider-tooltip-ratio': `${tooltipPercent / 100}`,
    };

    setSliderStyleValue(style, '--_rp-slider-color', getSliderColorValue(props.color));

    applySliderThumbStyle(style, getSliderThumbOptions(props.thumb), {
        size: '--rp-slider-thumb-size',
        border: '--_rp-slider-thumb-border-style',
        padding: '--rp-slider-thumb-padding',
        borderColor: '--_rp-slider-thumb-border',
    });

    return style;
}

export function useSlider(
    props: SliderStateProps,
    emitUpdate: (value: number) => void,
    getValue: () => number = () => props.modelValue ?? props.min,
) {
    const control = useControlState(props);

    const bounds = computed(() => normalizeSliderBounds(props.min, props.max));
    const nativeStep = computed(() => normalizeSliderStep(props.step));

    const normalizedValue = computed(() =>
        normalizeSliderValue(getValue(), bounds.value.min, bounds.value.max, nativeStep.value),
    );

    const valuePercent = computed(() =>
        getSliderValuePercent(normalizedValue.value, bounds.value.min, bounds.value.max),
    );

    const formattedValue = computed(() =>
        getFormattedSliderValue(normalizedValue.value, props.formatValue),
    );

    const ariaValueText = computed(() =>
        getSliderAriaValueText(normalizedValue.value, props.ariaValueText, props.formatValue),
    );

    const markItems = computed(() =>
        createSliderMarkItems(
            props.marks,
            bounds.value.min,
            bounds.value.max,
            (_value, percent) => percent <= valuePercent.value,
            {
                position: '--_rp-slider-mark-position',
                colors: [
                    '--_rp-slider-mark-color',
                    '--_rp-slider-mark-label-color',
                    '--_rp-slider-mark-filled-label-color',
                    '--_rp-slider-mark-ring-color',
                ],
            },
        ),
    );

    const tooltipOptions = computed(() => getSliderTooltipOptions(props.tooltip));
    const tooltipAnchor = computed(() => getSliderTooltipAnchor(props.tooltip));
    const tooltipMode = computed(() => getSliderTooltipMode(props.tooltip));
    const tooltipOpenDelay = computed(() => tooltipOptions.value.openDelay ?? 0);
    const {
        isOpen: delayedTooltipOpen,
        open: openDelayedTooltip,
        closeImmediate: closeDelayedTooltip,
    } = useDelayedOpen({
        openDelay: () => tooltipOpenDelay.value,
        disabled: () => tooltipMode.value !== 'hover' || control.disabled,
    });
    const trackHovered = ref(false);
    const focusWithin = ref(false);
    const dragging = ref(false);
    const previewAvailable = ref(false);
    const previewValue = ref(normalizedValue.value);
    let dismissed = false;
    let dragView: Window | null = null;
    let dragPointerId: number | undefined;
    let dragTrack: HTMLElement | null = null;
    let previewFrameView: Window | null = null;
    let previewFrameId: number | undefined;
    let pendingPreview: { clientX: number; clientY: number; track: HTMLElement } | undefined;

    const hasMarkLabels = computed(() => markItems.value.some((mark) => mark.hasLabel));
    const thumbMode = computed(() => getSliderThumbMode(props.thumb));
    const trackSlotProps = computed<SliderTrackSlotProps>(() => ({
        value: normalizedValue.value,
        formattedValue: formattedValue.value,
        percent: valuePercent.value,
        min: bounds.value.min,
        max: bounds.value.max,
        orientation: props.orientation,
        getPercent(value) {
            return getSliderValuePercent(value, bounds.value.min, bounds.value.max);
        },
    }));
    const tooltipVisible = computed(() => tooltipMode.value !== false);
    const tooltipAlwaysVisible = computed(() => tooltipMode.value === 'always');
    const tooltipOpen = computed(
        () =>
            tooltipAlwaysVisible.value ||
            (tooltipMode.value === 'hover' && delayedTooltipOpen.value && !control.disabled),
    );
    const tooltipPlacement = computed(
        () => tooltipOptions.value.placement ?? (props.orientation === 'vertical' ? 'left' : 'top'),
    );
    const tooltipId = computed(() => tooltipOptions.value.id);
    const tooltipColor = computed(() => tooltipOptions.value.color);
    const tooltipAutoContrast = computed(() => tooltipOptions.value.autoContrast);
    const tooltipContrastColor = computed(() => tooltipOptions.value.contrastColor);
    const tooltipOffset = computed(() => tooltipOptions.value.offset);
    const tooltipArrow = computed(() => tooltipOptions.value.arrow ?? false);
    const tooltipValue = computed(() =>
        tooltipAnchor.value === 'pointer' && previewAvailable.value
            ? previewValue.value
            : normalizedValue.value,
    );
    const tooltipPercent = computed(() =>
        getSliderValuePercent(tooltipValue.value, bounds.value.min, bounds.value.max),
    );
    const tooltipFormattedValue = computed(() =>
        getFormattedSliderValue(tooltipValue.value, props.formatValue),
    );
    const tooltipContent = computed(() => String(tooltipFormattedValue.value));

    const rootClass = computed(() =>
        bem('rp-slider', {
            [`size-${props.size}`]: Boolean(props.size),
            vertical: props.orientation === 'vertical',
            marked: markItems.value.length > 0,
            'marks-with-labels': hasMarkLabels.value,
            'tooltip-always-visible': tooltipAlwaysVisible.value,
            'thumb-interaction': thumbMode.value === 'interaction',
            'thumb-hidden': thumbMode.value === false,
            disabled: control.disabled,
            invalid: control.invalid,
        }),
    );

    const trackStyle = computed<CSSProperties>(() =>
        getSliderTrackStyle(props, valuePercent.value, tooltipPercent.value),
    );

    function onInput(e: Event) {
        if (control.disabled) return;

        const input = e.target as HTMLInputElement;
        emitUpdate(
            normalizeSliderValue(
                input.valueAsNumber,
                bounds.value.min,
                bounds.value.max,
                nativeStep.value,
            ),
        );
    }

    function hasTooltipInteraction() {
        if (tooltipAnchor.value === 'pointer') {
            return previewAvailable.value && (trackHovered.value || dragging.value);
        }

        return trackHovered.value || focusWithin.value || dragging.value;
    }

    function syncTooltip() {
        if (
            tooltipMode.value === 'hover' &&
            !control.disabled &&
            hasTooltipInteraction() &&
            !dismissed
        ) {
            openDelayedTooltip();
            return;
        }

        closeDelayedTooltip();
    }

    function onTooltipTrackEnter(event: PointerEvent) {
        if (control.disabled) return;

        if (tooltipAnchor.value === 'pointer') {
            cancelScheduledPreview();
            previewAvailable.value = false;
            const track = event.currentTarget as HTMLElement | null;
            if (track) updatePreviewFromPointer(event, track);
        }
        trackHovered.value = true;
        dismissed = false;
        syncTooltip();
    }

    function onTooltipTrackLeave() {
        trackHovered.value = false;
        if (!dragging.value && tooltipAnchor.value === 'pointer') {
            cancelScheduledPreview();
        }
        syncTooltip();
    }

    function onTooltipFocusIn() {
        focusWithin.value = true;
        dismissed = false;
        syncTooltip();
    }

    function onTooltipFocusOut() {
        focusWithin.value = false;
        syncTooltip();
    }

    function removeDragListeners() {
        dragView?.removeEventListener('pointermove', onTooltipWindowPointerMove);
        dragView?.removeEventListener('pointerup', onTooltipPointerEnd);
        dragView?.removeEventListener('pointercancel', onTooltipPointerEnd);
        dragView = null;
        dragPointerId = undefined;
        dragTrack = null;
    }

    function cancelScheduledPreview() {
        if (previewFrameId !== undefined) {
            previewFrameView?.cancelAnimationFrame(previewFrameId);
        }
        previewFrameView = null;
        previewFrameId = undefined;
        pendingPreview = undefined;
    }

    function updatePreviewFromPointer(
        pointer: { clientX: number; clientY: number },
        track: HTMLElement,
    ) {
        if (tooltipAnchor.value !== 'pointer' || control.disabled) return false;

        const vertical = props.orientation === 'vertical';
        const travelRect = track
            .querySelector<HTMLElement>('.rp-slider__travel')
            ?.getBoundingClientRect();
        const trackRect = track.getBoundingClientRect();
        const rect =
            travelRect && (vertical ? travelRect.height > 0 : travelRect.width > 0)
                ? travelRect
                : trackRect;
        const length = vertical ? rect.height : rect.width;
        if (length <= 0) return false;

        const offset = vertical ? rect.bottom - pointer.clientY : pointer.clientX - rect.left;
        const ratio = Math.min(1, Math.max(0, offset / length));
        const rawValue = bounds.value.min + ratio * (bounds.value.max - bounds.value.min);
        previewValue.value = normalizeSliderValue(
            rawValue,
            bounds.value.min,
            bounds.value.max,
            nativeStep.value,
        );
        previewAvailable.value = true;
        return true;
    }

    function applyScheduledPreview() {
        const pending = pendingPreview;
        pendingPreview = undefined;
        if (pending && updatePreviewFromPointer(pending, pending.track)) syncTooltip();
    }

    function onPreviewAnimationFrame() {
        previewFrameView = null;
        previewFrameId = undefined;
        applyScheduledPreview();
    }

    function schedulePreview(event: PointerEvent, track: HTMLElement) {
        if (tooltipAnchor.value !== 'pointer' || control.disabled) return;

        pendingPreview = { clientX: event.clientX, clientY: event.clientY, track };
        const view = track.ownerDocument.defaultView;
        if (!view?.requestAnimationFrame) {
            applyScheduledPreview();
            return;
        }
        if (previewFrameId !== undefined) return;

        previewFrameView = view;
        previewFrameId = view.requestAnimationFrame(onPreviewAnimationFrame);
    }

    function onTooltipPointerMove(event: PointerEvent) {
        if (dragPointerId !== undefined && dragging.value && event.pointerId !== dragPointerId) {
            return;
        }

        const track = event.currentTarget as HTMLElement | null;
        if (track) schedulePreview(event, track);
    }

    function onTooltipWindowPointerMove(event: PointerEvent) {
        if (dragPointerId !== undefined && event.pointerId !== dragPointerId) return;
        if (dragTrack) schedulePreview(event, dragTrack);
    }

    function onTooltipPointerEnd(event: PointerEvent) {
        if (dragPointerId !== undefined && event.pointerId !== dragPointerId) return;

        cancelScheduledPreview();
        if (dragTrack) updatePreviewFromPointer(event, dragTrack);
        dragging.value = false;
        removeDragListeners();
        syncTooltip();
    }

    function onTooltipPointerDown(event: PointerEvent) {
        if (control.disabled || event.button !== 0 || event.isPrimary === false) return;

        removeDragListeners();
        dismissed = false;
        dragging.value = true;
        dragPointerId = Number.isFinite(event.pointerId) ? event.pointerId : undefined;
        dragTrack = event.currentTarget as HTMLElement | null;
        if (dragTrack) updatePreviewFromPointer(event, dragTrack);
        dragView = dragTrack?.ownerDocument.defaultView ?? null;
        dragView?.addEventListener('pointermove', onTooltipWindowPointerMove);
        dragView?.addEventListener('pointerup', onTooltipPointerEnd);
        dragView?.addEventListener('pointercancel', onTooltipPointerEnd);
        syncTooltip();
    }

    function onTooltipKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            dismissed = true;
            closeDelayedTooltip();
        }
    }

    onBeforeUnmount(() => {
        removeDragListeners();
        cancelScheduledPreview();
    });

    return {
        control,
        nativeMin: computed(() => bounds.value.min),
        nativeMax: computed(() => bounds.value.max),
        nativeStep,
        rootClass,
        normalizedValue,
        valuePercent,
        formattedValue,
        ariaValueText,
        markItems,
        thumbMode,
        trackSlotProps,
        trackStyle,
        trackHovered,
        dragging,
        tooltipVisible,
        tooltipOpen,
        tooltipAnchor,
        tooltipPlacement,
        tooltipId,
        tooltipColor,
        tooltipAutoContrast,
        tooltipContrastColor,
        tooltipOffset,
        tooltipOpenDelay,
        tooltipArrow,
        tooltipValue,
        tooltipPercent,
        tooltipFormattedValue,
        tooltipContent,
        onInput,
        onTooltipPointerDown,
        onTooltipPointerMove,
        onTooltipTrackEnter,
        onTooltipTrackLeave,
        onTooltipFocusIn,
        onTooltipFocusOut,
        onTooltipKeydown,
    };
}
