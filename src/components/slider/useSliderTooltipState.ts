import { computed, ref, type ComputedRef } from 'vue';
import { useDelayedOpen } from '@/internal/composables/useDelayedOpen';
import { getValuePercent } from '@/utils/number';
import {
    getFormattedSliderValue,
    getSliderTooltipAnchor,
    getSliderTooltipMode,
    getSliderTooltipOptions,
    type SliderBounds,
} from './sliderModel';
import type { SliderOrientation, SliderProps, SliderTooltip } from './types';
import { useSliderPointerPreview } from './useSliderPointerPreview';

interface UseSliderTooltipStateOptions {
    tooltip: () => SliderTooltip;
    orientation: () => SliderOrientation;
    disabled: () => boolean;
    value: ComputedRef<number>;
    bounds: ComputedRef<SliderBounds>;
    step: ComputedRef<number | 'any'>;
    formatValue: () => SliderProps['formatValue'];
}

export function useSliderTooltipState(options: UseSliderTooltipStateOptions) {
    const tooltipOptions = computed(() => getSliderTooltipOptions(options.tooltip()));
    const tooltipAnchor = computed(() => getSliderTooltipAnchor(options.tooltip()));
    const tooltipMode = computed(() => getSliderTooltipMode(options.tooltip()));
    const tooltipOpenDelay = computed(() => tooltipOptions.value.openDelay ?? 0);
    const delayedTooltip = useDelayedOpen({
        openDelay: () => tooltipOpenDelay.value,
        disabled: () => tooltipMode.value !== 'hover' || options.disabled(),
    });
    const trackHovered = ref(false);
    const focusWithin = ref(false);
    let dismissed = false;
    const pointerPreview = useSliderPointerPreview({
        enabled: () => tooltipAnchor.value === 'pointer',
        disabled: options.disabled,
        orientation: options.orientation,
        bounds: options.bounds,
        step: options.step,
        initialValue: options.value.value,
        onStateChange: syncTooltip,
    });

    function hasTooltipInteraction() {
        if (tooltipAnchor.value === 'pointer') {
            return (
                pointerPreview.previewAvailable.value &&
                (trackHovered.value || pointerPreview.dragging.value)
            );
        }

        return trackHovered.value || focusWithin.value || pointerPreview.dragging.value;
    }

    function syncTooltip() {
        if (
            tooltipMode.value === 'hover' &&
            !options.disabled() &&
            hasTooltipInteraction() &&
            !dismissed
        ) {
            delayedTooltip.open();
            return;
        }

        delayedTooltip.closeImmediate();
    }

    function onTooltipTrackEnter(event: PointerEvent) {
        if (options.disabled()) return;

        pointerPreview.onTrackEnter(event);
        trackHovered.value = true;
        dismissed = false;
        syncTooltip();
    }

    function onTooltipTrackLeave() {
        trackHovered.value = false;
        pointerPreview.onTrackLeave();
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

    function onTooltipPointerDown(event: PointerEvent) {
        if (!pointerPreview.onPointerDown(event)) return;

        dismissed = false;
        syncTooltip();
    }

    function onTooltipKeydown(event: KeyboardEvent) {
        if (event.key !== 'Escape') return;

        dismissed = true;
        delayedTooltip.closeImmediate();
    }

    const tooltipVisible = computed(() => tooltipMode.value !== false);
    const tooltipAlwaysVisible = computed(() => tooltipMode.value === 'always');
    const tooltipOpen = computed(
        () =>
            tooltipAlwaysVisible.value ||
            (tooltipMode.value === 'hover' && delayedTooltip.isOpen.value && !options.disabled()),
    );
    const tooltipPlacement = computed(
        () =>
            tooltipOptions.value.placement ??
            (options.orientation() === 'vertical' ? 'left' : 'top'),
    );
    const tooltipId = computed(() => tooltipOptions.value.id);
    const tooltipColor = computed(() => tooltipOptions.value.color);
    const tooltipAutoContrast = computed(() => tooltipOptions.value.autoContrast);
    const tooltipContrastColor = computed(() => tooltipOptions.value.contrastColor);
    const tooltipOffset = computed(() => tooltipOptions.value.offset);
    const tooltipArrow = computed(() => tooltipOptions.value.arrow ?? false);
    const tooltipValue = computed(() =>
        tooltipAnchor.value === 'pointer' && pointerPreview.previewAvailable.value
            ? pointerPreview.previewValue.value
            : options.value.value,
    );
    const tooltipPercent = computed(() =>
        getValuePercent(tooltipValue.value, options.bounds.value.min, options.bounds.value.max),
    );
    const tooltipFormattedValue = computed(() =>
        getFormattedSliderValue(tooltipValue.value, options.formatValue()),
    );
    const tooltipContent = computed(() => String(tooltipFormattedValue.value));

    return {
        trackHovered,
        dragging: pointerPreview.dragging,
        tooltipVisible,
        tooltipOpen,
        tooltipAlwaysVisible,
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
        onTooltipPointerDown,
        onTooltipPointerMove: pointerPreview.onPointerMove,
        onTooltipTrackEnter,
        onTooltipTrackLeave,
        onTooltipFocusIn,
        onTooltipFocusOut,
        onTooltipKeydown,
    };
}
