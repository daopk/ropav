import { computed, onBeforeUnmount, ref, type CSSProperties } from 'vue';
import { useDelayedOpen } from '@/composables/useDelayedOpen';
import { useControlState } from '@/composables/useControlState';
import { bem } from '@/utils/bem';
import { getComponentColorValue } from '@/utils/componentColors';
import {
    applySliderThumbStyle,
    createSliderMarkItems,
    getFormattedSliderValue,
    getSliderAriaValueText,
    getSliderTooltipMode,
    getSliderTooltipOptions,
    getSliderValuePercent,
    normalizeSliderBounds,
    normalizeSliderStep,
    normalizeSliderValue,
    setSliderStyleValue,
} from './sliderCore';
import type { SliderProps } from './types';

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
        orientation: NonNullable<SliderProps['orientation']>;
    }
>;

function getSliderColorValue(color: SliderProps['color']) {
    return getComponentColorValue(color);
}

function getSliderTrackStyle(props: SliderStateProps, valuePercent: number) {
    const style: CSSProperties = {
        '--_rp-slider-percent': `${valuePercent}%`,
        '--_rp-slider-ratio': `${valuePercent / 100}`,
    };

    setSliderStyleValue(style, '--_rp-slider-color', getSliderColorValue(props.color));

    applySliderThumbStyle(style, props.thumb, {
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
    let dismissed = false;
    let dragView: Window | null = null;
    let dragPointerId: number | undefined;

    const hasMarkLabels = computed(() => markItems.value.some((mark) => mark.hasLabel));
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
    const tooltipOffset = computed(() => tooltipOptions.value.offset);
    const tooltipArrow = computed(() => tooltipOptions.value.arrow ?? false);
    const tooltipContent = computed(() => String(formattedValue.value));

    const rootClass = computed(() =>
        bem('rp-slider', {
            [`size-${props.size}`]: Boolean(props.size),
            vertical: props.orientation === 'vertical',
            marked: markItems.value.length > 0,
            'marks-with-labels': hasMarkLabels.value,
            'tooltip-always-visible': tooltipAlwaysVisible.value,
            disabled: control.disabled,
            invalid: control.invalid,
        }),
    );

    const trackStyle = computed<CSSProperties>(() =>
        getSliderTrackStyle(props, valuePercent.value),
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

    function onTooltipMouseEnter() {
        trackHovered.value = true;
        dismissed = false;
        syncTooltip();
    }

    function onTooltipMouseLeave() {
        trackHovered.value = false;
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
        dragView?.removeEventListener('pointerup', onTooltipPointerEnd);
        dragView?.removeEventListener('pointercancel', onTooltipPointerEnd);
        dragView = null;
        dragPointerId = undefined;
    }

    function onTooltipPointerEnd(event: PointerEvent) {
        if (dragPointerId !== undefined && event.pointerId !== dragPointerId) return;

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
        dragView = (event.currentTarget as HTMLElement | null)?.ownerDocument.defaultView ?? null;
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

    onBeforeUnmount(removeDragListeners);

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
        trackStyle,
        tooltipVisible,
        tooltipOpen,
        tooltipPlacement,
        tooltipId,
        tooltipColor,
        tooltipOffset,
        tooltipOpenDelay,
        tooltipArrow,
        tooltipContent,
        onInput,
        onTooltipPointerDown,
        onTooltipMouseEnter,
        onTooltipMouseLeave,
        onTooltipFocusIn,
        onTooltipFocusOut,
        onTooltipKeydown,
    };
}
