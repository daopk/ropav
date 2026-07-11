import { computed, type CSSProperties } from 'vue';
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

    applySliderThumbStyle(style, props.thumbStyle, {
        size: '--_rp-slider-thumb-size',
        border: '--_rp-slider-thumb-border-style',
        padding: '--_rp-slider-thumb-padding',
        borderColor: '--_rp-slider-thumb-border',
    });

    return style;
}

export function useSlider(props: SliderStateProps, emitUpdate: (value: number) => void) {
    const control = useControlState(props);

    const bounds = computed(() => normalizeSliderBounds(props.min, props.max));
    const nativeStep = computed(() => normalizeSliderStep(props.step));

    const normalizedValue = computed(() =>
        normalizeSliderValue(
            props.modelValue,
            bounds.value.min,
            bounds.value.max,
            nativeStep.value,
        ),
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
            valid: control.valid && !control.invalid,
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

    function openTooltip() {
        if (tooltipMode.value === 'hover' && !control.disabled) openDelayedTooltip();
    }

    function closeTooltip() {
        closeDelayedTooltip();
    }

    function onTooltipKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') closeTooltip();
    }

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
        openTooltip,
        closeTooltip,
        onTooltipKeydown,
    };
}
