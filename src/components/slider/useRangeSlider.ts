import { computed, ref, type CSSProperties } from 'vue';
import { useControlState } from '@/composables/useControlState';
import { bem } from '@/utils/bem';
import { getComponentColorValue } from '@/utils/componentColors';
import type {
    RangeSliderEndpointValueText,
    RangeSliderProps,
    RangeSliderThumb,
    RangeSliderValue,
} from './types';
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
import { useRangeSliderPointer } from './useRangeSliderPointer';
import { useRangeSliderTooltipState } from './useRangeSliderTooltipState';

type RangeSliderStateProps = Readonly<
    RangeSliderProps & {
        min: number;
        max: number;
        step: number | 'any';
        minRange: number;
        tooltip: NonNullable<RangeSliderProps['tooltip']>;
        orientation: NonNullable<RangeSliderProps['orientation']>;
        ariaLabel: [string, string];
    }
>;

function roundSliderNumber(value: number) {
    return Number(value.toFixed(10));
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function getStepValueAtOrAbove(value: number, min: number, step: number | 'any') {
    if (step === 'any') return value;

    const steps = Math.ceil((value - min) / step - 1e-10);
    return roundSliderNumber(min + steps * step);
}

function getStepValueAtOrBelow(value: number, min: number, step: number | 'any') {
    if (step === 'any') return value;

    const steps = Math.floor((value - min) / step + 1e-10);
    return roundSliderNumber(min + steps * step);
}

function isSliderStepAligned(min: number, max: number, step: number) {
    const stepCount = (max - min) / step;
    return Math.abs(stepCount - Math.round(stepCount)) <= 1e-10;
}

export function normalizeRangeSliderMinRange(minRange: number, min: number, max: number) {
    const bounds = normalizeSliderBounds(min, max);
    const domain = bounds.max - bounds.min;
    const safeMinRange = Number.isFinite(minRange) && minRange > 0 ? minRange : 0;

    return Math.min(domain, safeMinRange);
}

export function normalizeRangeSliderValue(
    value: RangeSliderValue,
    min: number,
    max: number,
    step: number | 'any',
    minRange = 0,
): RangeSliderValue {
    const bounds = normalizeSliderBounds(min, max);
    const safeStep = normalizeSliderStep(step);
    const safeMinRange = normalizeRangeSliderMinRange(minRange, bounds.min, bounds.max);
    const first = normalizeSliderValue(
        Array.isArray(value) ? Number(value[0]) : Number.NaN,
        bounds.min,
        bounds.max,
        safeStep,
    );
    const second = normalizeSliderValue(
        Array.isArray(value) ? Number(value[1]) : Number.NaN,
        bounds.min,
        bounds.max,
        safeStep,
    );
    const lower = Math.min(first, second);
    const upper = Math.max(first, second);

    if (upper - lower >= safeMinRange) return [lower, upper];
    if (safeMinRange >= bounds.max - bounds.min) return [bounds.min, bounds.max];

    const expandedUpper = getStepValueAtOrAbove(lower + safeMinRange, bounds.min, safeStep);
    if (expandedUpper <= bounds.max) return [lower, expandedUpper];

    const expandedLower = getStepValueAtOrBelow(bounds.max - safeMinRange, bounds.min, safeStep);

    return [Math.max(bounds.min, expandedLower), bounds.max];
}

export function getClosestRangeSliderThumb(
    value: number,
    range: RangeSliderValue,
    activeThumb?: RangeSliderThumb,
): RangeSliderThumb {
    const [lower, upper] = range;

    if (value < lower) return 'lower';
    if (value > upper) return 'upper';

    const lowerDistance = Math.abs(value - lower);
    const upperDistance = Math.abs(value - upper);

    if (lowerDistance < upperDistance) return 'lower';
    if (upperDistance < lowerDistance) return 'upper';

    return activeThumb ?? 'upper';
}

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

    applySliderThumbStyle(style, props.thumbStyle, {
        size: '--_rp-range-slider-thumb-size',
        border: '--_rp-range-slider-thumb-border-style',
        padding: '--_rp-range-slider-thumb-padding',
        borderColor: '--_rp-range-slider-thumb-border',
    });

    return style;
}

function getFormattedRangeSliderValue(
    value: RangeSliderValue,
    formatter: RangeSliderProps['formatValue'],
): [string | number, string | number] {
    return [
        getFormattedSliderValue(value[0], formatter),
        getFormattedSliderValue(value[1], formatter),
    ];
}

function getRangeSliderAriaValueText(
    value: RangeSliderValue,
    ariaValueText: RangeSliderProps['ariaValueText'],
    formatter: RangeSliderProps['formatValue'],
): [string | undefined, string | undefined] {
    const endpointValues: [
        RangeSliderEndpointValueText | undefined,
        RangeSliderEndpointValueText | undefined,
    ] = Array.isArray(ariaValueText) ? ariaValueText : [ariaValueText, ariaValueText];

    return [
        getSliderAriaValueText(value[0], endpointValues[0], formatter),
        getSliderAriaValueText(value[1], endpointValues[1], formatter),
    ];
}

function getThumbIndex(thumb: RangeSliderThumb) {
    return thumb === 'lower' ? 0 : 1;
}

function getOppositeThumb(thumb: RangeSliderThumb): RangeSliderThumb {
    return thumb === 'lower' ? 'upper' : 'lower';
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
    const input = getThumbInput(track, thumb);
    input?.focus({ preventScroll: true });
}

export function useRangeSlider(
    props: RangeSliderStateProps,
    emitUpdate: (value: RangeSliderValue) => void,
) {
    const control = useControlState(props);
    const activeThumb = ref<RangeSliderThumb>();

    const bounds = computed(() => normalizeSliderBounds(props.min, props.max));
    const valueStep = computed(() => normalizeSliderStep(props.step));
    const nativeStep = computed<number | 'any'>(() => {
        const step = valueStep.value;
        if (step === 'any') return step;

        return isSliderStepAligned(bounds.value.min, bounds.value.max, step) ? step : 'any';
    });
    const hasManualNativeKeyboard = computed(
        () => valueStep.value !== 'any' && nativeStep.value === 'any',
    );
    const normalizedMinRange = computed(() =>
        normalizeRangeSliderMinRange(props.minRange, bounds.value.min, bounds.value.max),
    );
    const normalizedValue = computed(() =>
        normalizeRangeSliderValue(
            props.modelValue,
            bounds.value.min,
            bounds.value.max,
            valueStep.value,
            normalizedMinRange.value,
        ),
    );
    const valuePercent = computed<RangeSliderValue>(() => [
        getSliderValuePercent(normalizedValue.value[0], bounds.value.min, bounds.value.max),
        getSliderValuePercent(normalizedValue.value[1], bounds.value.min, bounds.value.max),
    ]);
    const formattedValue = computed(() =>
        getFormattedRangeSliderValue(normalizedValue.value, props.formatValue),
    );
    const ariaLabels = computed<[string, string]>(() => props.ariaLabel ?? ['Minimum', 'Maximum']);
    const ariaValueText = computed(() =>
        getRangeSliderAriaValueText(normalizedValue.value, props.ariaValueText, props.formatValue),
    );
    const nativeNames = computed<[string | undefined, string | undefined]>(() =>
        Array.isArray(props.name) ? props.name : [props.name, props.name],
    );
    const nativeIds = computed<[string | undefined, string | undefined]>(() => [
        control.id,
        control.id ? `${control.id}-upper` : undefined,
    ]);
    const nativeMin = computed<RangeSliderValue>(() => {
        if (normalizedMinRange.value === 0) {
            return [bounds.value.min, bounds.value.min];
        }

        return [
            bounds.value.min,
            clamp(
                getStepValueAtOrAbove(
                    normalizedValue.value[0] + normalizedMinRange.value,
                    bounds.value.min,
                    valueStep.value,
                ),
                bounds.value.min,
                bounds.value.max,
            ),
        ];
    });
    const nativeMax = computed<RangeSliderValue>(() => {
        if (normalizedMinRange.value === 0) {
            return [bounds.value.max, bounds.value.max];
        }

        return [
            clamp(
                getStepValueAtOrBelow(
                    normalizedValue.value[1] - normalizedMinRange.value,
                    bounds.value.min,
                    valueStep.value,
                ),
                bounds.value.min,
                bounds.value.max,
            ),
            bounds.value.max,
        ];
    });
    const markItems = computed(() =>
        createSliderMarkItems(
            props.marks,
            bounds.value.min,
            bounds.value.max,
            (value) => value >= normalizedValue.value[0] && value <= normalizedValue.value[1],
            {
                position: '--_rp-range-slider-mark-position',
                colors: [
                    '--_rp-range-slider-mark-color',
                    '--_rp-range-slider-mark-label-color',
                    '--_rp-range-slider-mark-filled-label-color',
                    '--_rp-range-slider-mark-ring-color',
                ],
            },
        ),
    );
    const hasMarkLabels = computed(() => markItems.value.some((mark) => mark.hasLabel));
    const trackStyle = computed<CSSProperties>(() =>
        getRangeSliderTrackStyle(props, valuePercent.value),
    );

    const tooltipOptions = computed(() => getSliderTooltipOptions(props.tooltip));
    const tooltipMode = computed(() => getSliderTooltipMode(props.tooltip));
    const tooltipOpenDelay = computed(() => tooltipOptions.value.openDelay ?? 0);
    const tooltipState = useRangeSliderTooltipState({
        mode: tooltipMode,
        openDelay: tooltipOpenDelay,
        disabled: () => control.disabled,
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
    const tooltipOffset = computed(() => tooltipOptions.value.offset);
    const tooltipArrow = computed(() => tooltipOptions.value.arrow ?? false);
    const tooltipContent = computed<[string, string]>(() => [
        String(formattedValue.value[0]),
        String(formattedValue.value[1]),
    ]);
    const mergedTooltipContent = computed(() => {
        const [lower, upper] = tooltipContent.value;
        return lower === upper ? lower : `${lower}–${upper}`;
    });

    const rootClass = computed(() =>
        bem('rp-range-slider', {
            [`size-${props.size}`]: Boolean(props.size),
            vertical: props.orientation === 'vertical',
            marked: markItems.value.length > 0,
            'marks-with-labels': hasMarkLabels.value,
            'tooltip-always-visible': tooltipAlwaysVisible.value,
            disabled: control.disabled,
        }),
    );

    function getThumbUpdate(
        thumb: RangeSliderThumb,
        value: number,
        anchorValue = normalizedValue.value[getThumbIndex(getOppositeThumb(thumb))],
    ) {
        const safeValue = normalizeSliderValue(
            value,
            bounds.value.min,
            bounds.value.max,
            valueStep.value,
        );

        if (normalizedMinRange.value > 0) {
            const nextValue: RangeSliderValue = [...normalizedValue.value];
            nextValue[getThumbIndex(thumb)] =
                thumb === 'lower'
                    ? Math.min(safeValue, nativeMax.value[0])
                    : Math.max(safeValue, nativeMin.value[1]);

            return { thumb, value: nextValue };
        }

        if (safeValue < anchorValue) {
            return { thumb: 'lower' as const, value: [safeValue, anchorValue] as RangeSliderValue };
        }
        if (safeValue > anchorValue) {
            return { thumb: 'upper' as const, value: [anchorValue, safeValue] as RangeSliderValue };
        }

        return { thumb, value: [safeValue, safeValue] as RangeSliderValue };
    }

    function updateThumb(thumb: RangeSliderThumb, value: number, anchorValue?: number) {
        if (control.disabled) return thumb;

        const update = getThumbUpdate(thumb, value, anchorValue);
        activeThumb.value = update.thumb;
        emitUpdate(update.value);

        return update.thumb;
    }

    function onInput(thumb: RangeSliderThumb, event: Event) {
        const input = event.target as HTMLInputElement;
        const nextThumb = updateThumb(thumb, input.valueAsNumber);
        transferFocusedThumb(input, thumb, nextThumb);
    }

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

    function onTooltipKeydown(thumb: RangeSliderThumb, event: KeyboardEvent) {
        if (tooltipState.onKeydown(thumb, event)) return;

        if (!hasManualNativeKeyboard.value || valueStep.value === 'any') return;

        const index = getThumbIndex(thumb);
        const currentValue = normalizedValue.value[index];
        const pageStep = valueStep.value * 10;
        let nextValue: number | undefined;

        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowUp':
                nextValue = currentValue + valueStep.value;
                break;
            case 'ArrowLeft':
            case 'ArrowDown':
                nextValue = currentValue - valueStep.value;
                break;
            case 'PageUp':
                nextValue = currentValue + pageStep;
                break;
            case 'PageDown':
                nextValue = currentValue - pageStep;
                break;
            case 'Home':
                nextValue = nativeMin.value[index];
                break;
            case 'End':
                nextValue = nativeMax.value[index];
                break;
        }

        if (nextValue == null) return;

        event.preventDefault();
        const nextThumb = updateThumb(thumb, nextValue);
        transferFocusedThumb(event.target as HTMLInputElement, thumb, nextThumb);
    }

    function getValueFromPointer(event: PointerEvent, track: HTMLElement) {
        const vertical = props.orientation === 'vertical';
        const trackRect = track.getBoundingClientRect();
        const thumbsRect = track
            .querySelector<HTMLElement>('.rp-range-slider__thumbs')
            ?.getBoundingClientRect();
        const rect =
            thumbsRect && (vertical ? thumbsRect.height > 0 : thumbsRect.width > 0)
                ? thumbsRect
                : trackRect;
        const length = vertical ? rect.height : rect.width;
        if (length <= 0) return undefined;

        const offset = vertical ? rect.bottom - event.clientY : event.clientX - rect.left;
        const ratio = clamp(offset / length, 0, 1);
        return bounds.value.min + ratio * (bounds.value.max - bounds.value.min);
    }

    const { onTrackPointerDown } = useRangeSliderPointer({
        disabled: () => control.disabled,
        getPointerValue: getValueFromPointer,
        getThumb: (event, value) =>
            getThumbFromTarget(event.target) ??
            getClosestRangeSliderThumb(value, normalizedValue.value, activeThumb.value),
        getAnchorValue: (thumb) => normalizedValue.value[getThumbIndex(getOppositeThumb(thumb))],
        setActiveThumb: (thumb) => {
            activeThumb.value = thumb;
        },
        focusThumb,
        updateThumb,
        transferFocusedThumb: (track, from, to) => {
            const input = getThumbInput(track, from);
            if (input) transferFocusedThumb(input, from, to);
        },
        startDrag: (thumb) => tooltipState.startInteraction(thumb, 'drag'),
        endDrag: (thumb) => tooltipState.endInteraction(thumb, 'drag'),
        transferDrag: (from, to) => tooltipState.transferInteraction(from, to, 'drag'),
    });

    return {
        control,
        nativeMin,
        nativeMax,
        nativeStep,
        nativeNames,
        nativeIds,
        rootClass,
        normalizedValue,
        valuePercent,
        formattedValue,
        ariaLabels,
        ariaValueText,
        markItems,
        trackStyle,
        activeThumb,
        tooltipVisible,
        tooltipOpen,
        tooltipPlacement,
        tooltipIds,
        mergedTooltipId,
        tooltipColor,
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
