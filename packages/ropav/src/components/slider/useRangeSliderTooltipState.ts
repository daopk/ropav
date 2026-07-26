import { computed, ref, watch, type ComputedRef } from 'vue';
import { useDelayedOpen } from '@/internal/composables/useDelayedOpen';
import type { RangeSliderThumb, SliderTooltipMode } from './types';

export type RangeSliderTooltipInteractionReason = 'focus' | 'drag';

interface TooltipInteractionReasons {
    focus: boolean;
    drag: boolean;
}

interface UseRangeSliderTooltipStateOptions {
    mode: ComputedRef<SliderTooltipMode | false>;
    openDelay: ComputedRef<number>;
    disabled: () => boolean;
    setActiveThumb: (thumb: RangeSliderThumb) => void;
}

export function useRangeSliderTooltipState(options: UseRangeSliderTooltipStateOptions) {
    const delayedTooltip = useDelayedOpen({
        openDelay: () => options.openDelay.value,
        disabled: () => options.mode.value !== 'hover' || options.disabled(),
    });
    const interactionReasons = ref<Record<RangeSliderThumb, TooltipInteractionReasons>>({
        lower: { focus: false, drag: false },
        upper: { focus: false, drag: false },
    });
    const trackHovered = ref(false);
    const dismissed = ref(false);

    function hasThumbInteraction(thumb: RangeSliderThumb) {
        const reasons = interactionReasons.value[thumb];
        return reasons.focus || reasons.drag;
    }

    function hasAnyInteraction() {
        return trackHovered.value || hasThumbInteraction('lower') || hasThumbInteraction('upper');
    }

    function sync() {
        if (
            options.mode.value === 'hover' &&
            !options.disabled() &&
            hasAnyInteraction() &&
            !dismissed.value
        ) {
            delayedTooltip.open();
            return;
        }

        delayedTooltip.closeImmediate();
    }

    function startInteraction(
        thumb: RangeSliderThumb,
        reason: RangeSliderTooltipInteractionReason,
    ) {
        options.setActiveThumb(thumb);
        const wasActive = hasAnyInteraction();
        const wasDismissed = dismissed.value;
        interactionReasons.value[thumb][reason] = true;
        dismissed.value = false;

        if (!wasActive || wasDismissed) sync();
    }

    function endInteraction(thumb: RangeSliderThumb, reason: RangeSliderTooltipInteractionReason) {
        interactionReasons.value[thumb][reason] = false;
        if (!hasAnyInteraction()) sync();
    }

    function transferInteraction(
        from: RangeSliderThumb,
        to: RangeSliderThumb,
        reason: RangeSliderTooltipInteractionReason,
    ) {
        if (!interactionReasons.value[from][reason]) return;

        interactionReasons.value[from][reason] = false;
        interactionReasons.value[to][reason] = true;
    }

    function onFocus(thumb: RangeSliderThumb) {
        startInteraction(thumb, 'focus');
    }

    function onBlur(thumb: RangeSliderThumb) {
        endInteraction(thumb, 'focus');
    }

    function onTrackMouseEnter() {
        const wasActive = hasAnyInteraction();
        const wasDismissed = dismissed.value;
        trackHovered.value = true;
        dismissed.value = false;

        if (!wasActive || wasDismissed) sync();
    }

    function onTrackMouseLeave() {
        trackHovered.value = false;
        if (!hasAnyInteraction()) sync();
    }

    function onKeydown(thumb: RangeSliderThumb, event: KeyboardEvent) {
        options.setActiveThumb(thumb);
        if (event.key === 'Escape') {
            dismissed.value = true;
            delayedTooltip.closeImmediate();
            return true;
        }

        if (dismissed.value) {
            dismissed.value = false;
            sync();
        }

        return false;
    }

    const visible = computed(() => options.mode.value !== false);
    const alwaysVisible = computed(() => options.mode.value === 'always');
    const open = computed(
        () =>
            alwaysVisible.value ||
            (options.mode.value === 'hover' &&
                delayedTooltip.isOpen.value &&
                hasAnyInteraction() &&
                !dismissed.value &&
                !options.disabled()),
    );

    watch([options.mode, options.disabled], sync);

    return {
        visible,
        alwaysVisible,
        open,
        startInteraction,
        endInteraction,
        transferInteraction,
        onFocus,
        onBlur,
        onTrackMouseEnter,
        onTrackMouseLeave,
        onKeydown,
    };
}
