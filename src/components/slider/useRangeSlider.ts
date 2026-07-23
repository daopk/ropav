import { computed, ref, type CSSProperties } from 'vue';
import { bem } from '@/utils/bem';
import { getComponentColorValue } from '@/utils/componentColors';
import {
    getClosestRangeSliderThumb,
    getOppositeRangeSliderThumb,
    getRangeSliderKeyboardValue,
    getRangeSliderPointerValue,
    getRangeSliderThumbIndex,
} from './rangeSliderModel';
import {
    applySliderThumbStyle,
    getSliderTooltipMode,
    getSliderTooltipOptions,
    setSliderStyleValue,
} from './sliderModel';
import type { RangeSliderThumb, RangeSliderValue } from './types';
import { useRangeSliderPointer } from './useRangeSliderPointer';
import { useRangeSliderTooltipState } from './useRangeSliderTooltipState';
import { useRangeSliderValueState, type RangeSliderStateProps } from './useRangeSliderValueState';

export {
    getClosestRangeSliderThumb,
    normalizeRangeSliderMinRange,
    normalizeRangeSliderValue,
} from './rangeSliderModel';

function getRangeSliderTrackStyle(props: RangeSliderStateProps, valuePercent: RangeSliderValue) {
    const [lowerPercent, upperPercent] = valuePercent;
    const style: CSSProperties = {
        '--_rp-range-slider-lower-percent': `${lowerPercent}%`,
        '--_rp-range-slider-upper-percent': `${upperPercent}%`,
        '--_rp-range-slider-lower-ratio': `${lowerPercent / 100}`,
        '--_rp-range-slider-upper-ratio': `${upperPercent / 100}`,
        '--_rp-range-slider-tooltip-merged-percent': `${(lowerPercent + upperPercent) / 2}%`,
    };

    setSliderStyleValue(style, '--_rp-range-slider-color', getComponentColorValue(props.color));
    applySliderThumbStyle(style, props.thumb, {
        size: '--rp-slider-thumb-size',
        border: '--_rp-range-slider-thumb-border-style',
        padding: '--rp-slider-thumb-padding',
        borderColor: '--_rp-range-slider-thumb-border',
    });

    return style;
}

function getThumbFromTarget(target: EventTarget | null) {
    const element = target as Element | null;
    const thumb = element
        ?.closest?.('[data-range-slider-thumb]')
        ?.getAttribute('data-range-slider-thumb');

    return thumb === 'lower' || thumb === 'upper' ? thumb : undefined;
}

function getThumbInput(track: HTMLElement, thumb: RangeSliderThumb) {
    return track.querySelector<HTMLInputElement>(
        `.rp-range-slider__native--${thumb}, input[data-range-slider-thumb="${thumb}"]`,
    );
}

function focusThumb(track: HTMLElement, thumb: RangeSliderThumb) {
    getThumbInput(track, thumb)?.focus({ preventScroll: true });
}

function readRangeSliderPointerGeometry(
    track: HTMLElement,
    orientation: RangeSliderStateProps['orientation'],
) {
    const vertical = orientation === 'vertical';
    const thumbsRect = track
        .querySelector<HTMLElement>('.rp-range-slider__thumbs')
        ?.getBoundingClientRect();
    const rect =
        thumbsRect && (vertical ? thumbsRect.height > 0 : thumbsRect.width > 0)
            ? thumbsRect
            : track.getBoundingClientRect();
    const length = vertical ? rect.height : rect.width;
    if (length <= 0) return undefined;

    return {
        length,
        start: vertical ? rect.bottom : rect.left,
        vertical,
    };
}

export function useRangeSlider(
    props: RangeSliderStateProps,
    onChange: (value: RangeSliderValue) => void,
) {
    const activeThumb = ref<RangeSliderThumb>();
    const valueState = useRangeSliderValueState(props, onChange, (thumb) => {
        activeThumb.value = thumb;
    });
    const tooltipOptions = computed(() => getSliderTooltipOptions(props.tooltip));
    const tooltipMode = computed(() => getSliderTooltipMode(props.tooltip));
    const tooltipOpenDelay = computed(() => tooltipOptions.value.openDelay ?? 0);
    const tooltipState = useRangeSliderTooltipState({
        mode: tooltipMode,
        openDelay: tooltipOpenDelay,
        disabled: () => valueState.control.disabled,
        setActiveThumb: (thumb) => {
            activeThumb.value = thumb;
        },
    });
    const tooltipVisible = tooltipState.visible;
    const tooltipAlwaysVisible = tooltipState.alwaysVisible;
    const tooltipOpen = tooltipState.open;
    const tooltipPlacement = computed(
        () => tooltipOptions.value.placement ?? (props.orientation === 'vertical' ? 'left' : 'top'),
    );
    const tooltipIds = computed<[string | undefined, string | undefined]>(() => {
        const baseId = tooltipOptions.value.id;
        return baseId ? [`${baseId}-lower`, `${baseId}-upper`] : [undefined, undefined];
    });
    const mergedTooltipId = computed(() => {
        const baseId = tooltipOptions.value.id;
        return baseId ? `${baseId}-merged` : undefined;
    });
    const tooltipColor = computed(() => tooltipOptions.value.color);
    const tooltipAutoContrast = computed(() => tooltipOptions.value.autoContrast);
    const tooltipContrastColor = computed(() => tooltipOptions.value.contrastColor);
    const tooltipOffset = computed(() => tooltipOptions.value.offset);
    const tooltipArrow = computed(() => tooltipOptions.value.arrow ?? false);
    const tooltipContent = computed<[string, string]>(() => [
        String(valueState.formattedValue.value[0]),
        String(valueState.formattedValue.value[1]),
    ]);
    const mergedTooltipContent = computed(() => {
        const [lower, upper] = tooltipContent.value;
        return lower === upper ? lower : `${lower}–${upper}`;
    });
    const rootClass = computed(() =>
        bem('rp-range-slider', {
            [`size-${props.size}`]: Boolean(props.size),
            vertical: props.orientation === 'vertical',
            marked: valueState.markItems.value.length > 0,
            'marks-with-labels': valueState.hasMarkLabels.value,
            'tooltip-always-visible': tooltipAlwaysVisible.value,
            disabled: valueState.control.disabled,
            invalid: valueState.control.invalid,
        }),
    );
    const trackStyle = computed<CSSProperties>(() =>
        getRangeSliderTrackStyle(props, valueState.valuePercent.value),
    );

    function transferFocusedThumb(
        input: HTMLInputElement,
        thumb: RangeSliderThumb,
        nextThumb: RangeSliderThumb,
    ) {
        if (thumb === nextThumb || input.ownerDocument.activeElement !== input) return;

        const track = input.closest<HTMLElement>('.rp-range-slider__track');
        if (!track) return;

        const nextInput = getThumbInput(track, nextThumb);
        if (!nextInput) return;

        tooltipState.transferInteraction(thumb, nextThumb, 'focus');
        nextInput.focus({ preventScroll: true });
    }

    function onInput(thumb: RangeSliderThumb, event: Event) {
        const input = event.target as HTMLInputElement;
        const nextThumb = valueState.updateThumb(thumb, input.valueAsNumber);
        transferFocusedThumb(input, thumb, nextThumb);
    }

    function onTooltipKeydown(thumb: RangeSliderThumb, event: KeyboardEvent) {
        if (tooltipState.onKeydown(thumb, event)) return;
        if (!valueState.hasManualNativeKeyboard.value || valueState.valueStep.value === 'any') {
            return;
        }

        const index = getRangeSliderThumbIndex(thumb);
        const nextValue = getRangeSliderKeyboardValue(
            event.key,
            valueState.normalizedValue.value[index],
            valueState.valueStep.value,
            valueState.nativeMin.value[index],
            valueState.nativeMax.value[index],
        );
        if (nextValue == null) return;

        event.preventDefault();
        const nextThumb = valueState.updateThumb(thumb, nextValue);
        transferFocusedThumb(event.target as HTMLInputElement, thumb, nextThumb);
    }

    const { onTrackPointerDown } = useRangeSliderPointer({
        disabled: () => valueState.control.disabled,
        getPointerGeometry: (track) => readRangeSliderPointerGeometry(track, props.orientation),
        getPointerValue: (event, geometry) =>
            getRangeSliderPointerValue(event, geometry, valueState.bounds.value),
        getThumb: (event, value) =>
            getThumbFromTarget(event.target) ??
            getClosestRangeSliderThumb(value, valueState.normalizedValue.value, activeThumb.value),
        getAnchorValue: (thumb) =>
            valueState.normalizedValue.value[
                getRangeSliderThumbIndex(getOppositeRangeSliderThumb(thumb))
            ],
        setActiveThumb: (thumb) => {
            activeThumb.value = thumb;
        },
        focusThumb,
        updateThumb: valueState.updateThumb,
        transferFocusedThumb: (track, from, to) => {
            const input = getThumbInput(track, from);
            if (input) transferFocusedThumb(input, from, to);
        },
        startDrag: (thumb) => tooltipState.startInteraction(thumb, 'drag'),
        endDrag: (thumb) => tooltipState.endInteraction(thumb, 'drag'),
        transferDrag: (from, to) => tooltipState.transferInteraction(from, to, 'drag'),
    });

    return {
        nativeElements: valueState.nativeElements,
        setInputRef: valueState.setInputRef,
        focus: valueState.focus,
        control: valueState.control,
        nativeMin: valueState.nativeMin,
        nativeMax: valueState.nativeMax,
        nativeStep: valueState.nativeStep,
        nativeNames: valueState.nativeNames,
        nativeIds: valueState.nativeIds,
        rootClass,
        normalizedValue: valueState.normalizedValue,
        valuePercent: valueState.valuePercent,
        formattedValue: valueState.formattedValue,
        ariaLabels: valueState.ariaLabels,
        ariaValueText: valueState.ariaValueText,
        markItems: valueState.markItems,
        trackSlotProps: valueState.trackSlotProps,
        trackStyle,
        activeThumb,
        tooltipVisible,
        tooltipOpen,
        tooltipPlacement,
        tooltipIds,
        mergedTooltipId,
        tooltipColor,
        tooltipAutoContrast,
        tooltipContrastColor,
        tooltipOffset,
        tooltipOpenDelay,
        tooltipArrow,
        tooltipContent,
        mergedTooltipContent,
        onInput,
        onTrackPointerDown,
        onTooltipFocus: tooltipState.onFocus,
        onTooltipBlur: tooltipState.onBlur,
        onTooltipTrackMouseEnter: tooltipState.onTrackMouseEnter,
        onTooltipTrackMouseLeave: tooltipState.onTrackMouseLeave,
        onTooltipKeydown,
    };
}
