import { computed, type CSSProperties } from 'vue';
import { bem } from '@/utils/bem';
import { getComponentColorValue } from '@/utils/componentColors';
import {
    applySliderThumbStyle,
    getSliderThumbMode,
    getSliderThumbOptions,
    setSliderStyleValue,
} from './sliderModel';
import { useSliderTooltipState } from './useSliderTooltipState';
import { useSliderValueState, type SliderStateProps } from './useSliderValueState';

export { normalizeSliderBounds, normalizeSliderStep, normalizeSliderValue } from './sliderModel';

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

    setSliderStyleValue(style, '--_rp-slider-color', getComponentColorValue(props.color));
    applySliderThumbStyle(style, getSliderThumbOptions(props.thumb), {
        size: '--rp-slider-thumb-size',
        border: '--_rp-slider-thumb-border-style',
        padding: '--rp-slider-thumb-padding',
        borderColor: '--_rp-slider-thumb-border',
    });

    return style;
}

export function useSlider(props: SliderStateProps, onChange: (value: number) => void) {
    const valueState = useSliderValueState(props, onChange);
    const tooltipState = useSliderTooltipState({
        tooltip: () => props.tooltip,
        orientation: () => props.orientation,
        disabled: () => valueState.control.disabled,
        value: valueState.normalizedValue,
        bounds: valueState.bounds,
        step: valueState.nativeStep,
        formatValue: () => props.formatValue,
    });
    const thumbMode = computed(() => getSliderThumbMode(props.thumb));
    const rootClass = computed(() =>
        bem('rp-slider', {
            [`size-${props.size}`]: Boolean(props.size),
            vertical: props.orientation === 'vertical',
            marked: valueState.markItems.value.length > 0,
            'marks-with-labels': valueState.hasMarkLabels.value,
            'tooltip-always-visible': tooltipState.tooltipAlwaysVisible.value,
            'thumb-interaction': thumbMode.value === 'interaction',
            'thumb-hidden': thumbMode.value === false,
            disabled: valueState.control.disabled,
            invalid: valueState.control.invalid,
        }),
    );
    const trackStyle = computed<CSSProperties>(() =>
        getSliderTrackStyle(
            props,
            valueState.valuePercent.value,
            tooltipState.tooltipPercent.value,
        ),
    );

    return {
        inputRef: valueState.inputRef,
        focus: valueState.focus,
        control: valueState.control,
        nativeMin: valueState.nativeMin,
        nativeMax: valueState.nativeMax,
        nativeStep: valueState.nativeStep,
        rootClass,
        normalizedValue: valueState.normalizedValue,
        valuePercent: valueState.valuePercent,
        formattedValue: valueState.formattedValue,
        ariaValueText: valueState.ariaValueText,
        markItems: valueState.markItems,
        thumbMode,
        trackSlotProps: valueState.trackSlotProps,
        trackStyle,
        trackHovered: tooltipState.trackHovered,
        dragging: tooltipState.dragging,
        tooltipVisible: tooltipState.tooltipVisible,
        tooltipOpen: tooltipState.tooltipOpen,
        tooltipAnchor: tooltipState.tooltipAnchor,
        tooltipPlacement: tooltipState.tooltipPlacement,
        tooltipId: tooltipState.tooltipId,
        tooltipColor: tooltipState.tooltipColor,
        tooltipAutoContrast: tooltipState.tooltipAutoContrast,
        tooltipContrastColor: tooltipState.tooltipContrastColor,
        tooltipOffset: tooltipState.tooltipOffset,
        tooltipOpenDelay: tooltipState.tooltipOpenDelay,
        tooltipArrow: tooltipState.tooltipArrow,
        tooltipValue: tooltipState.tooltipValue,
        tooltipPercent: tooltipState.tooltipPercent,
        tooltipFormattedValue: tooltipState.tooltipFormattedValue,
        tooltipContent: tooltipState.tooltipContent,
        onInput: valueState.onInput,
        onTooltipPointerDown: tooltipState.onTooltipPointerDown,
        onTooltipPointerMove: tooltipState.onTooltipPointerMove,
        onTooltipTrackEnter: tooltipState.onTooltipTrackEnter,
        onTooltipTrackLeave: tooltipState.onTooltipTrackLeave,
        onTooltipFocusIn: tooltipState.onTooltipFocusIn,
        onTooltipFocusOut: tooltipState.onTooltipFocusOut,
        onTooltipKeydown: tooltipState.onTooltipKeydown,
    };
}
