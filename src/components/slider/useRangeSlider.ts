import { computed, onBeforeUnmount, ref, watch, type CSSProperties } from 'vue';
import { useDelayedOpen } from '@/composables/useDelayedOpen';
import { useControlState } from '@/composables/useControlState';
import { bem } from '@/utils/bem';
import { getComponentColorValue } from '@/utils/componentColors';
import type {
    RangeSliderEndpointValueText,
    RangeSliderProps,
    RangeSliderThumb,
    RangeSliderValue,
    SliderMark,
    SliderMarkInput,
    SliderTooltipMode,
    SliderTooltipOptions,
} from './types';
import {
    getSliderValuePercent,
    normalizeSliderBounds,
    normalizeSliderStep,
    normalizeSliderValue,
} from './useSlider';

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

type TooltipInteractionReason = 'focus' | 'drag';

interface TooltipInteractionReasons {
    focus: boolean;
    drag: boolean;
}

const rangeSliderMarkColorProperties = [
    '--_rp-range-slider-mark-color',
    '--_rp-range-slider-mark-label-color',
    '--_rp-range-slider-mark-filled-label-color',
    '--_rp-range-slider-mark-ring-color',
] as const;

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

function setRangeSliderStyleValue(
    style: CSSProperties,
    property: `--_rp-range-slider-${string}`,
    value: string | undefined,
) {
    if (value) style[property] = value;
}

function getRangeSliderLengthValue(value: number | string | undefined) {
    if (value == null || value === '') return undefined;
    if (typeof value === 'number') return Number.isFinite(value) ? `${value}px` : undefined;

    return value;
}

function getRangeSliderBorderValue(value: number | string | undefined) {
    if (value == null || value === '') return undefined;
    if (typeof value === 'number') {
        return Number.isFinite(value)
            ? `${value}px solid var(--_rp-range-slider-thumb-border)`
            : undefined;
    }

    return value;
}

const rangeSliderThumbStyleProps = [
    ['--_rp-range-slider-thumb-size', 'size', getRangeSliderLengthValue],
    ['--_rp-range-slider-thumb-border-style', 'border', getRangeSliderBorderValue],
    ['--_rp-range-slider-thumb-padding', 'padding', getRangeSliderLengthValue],
] as const;

function getRangeSliderTrackStyle(props: RangeSliderStateProps, valuePercent: RangeSliderValue) {
    const [lowerPercent, upperPercent] = valuePercent;
    const style: CSSProperties = {
        '--_rp-range-slider-lower-percent': `${lowerPercent}%`,
        '--_rp-range-slider-upper-percent': `${upperPercent}%`,
        '--_rp-range-slider-lower-ratio': `${lowerPercent / 100}`,
        '--_rp-range-slider-upper-ratio': `${upperPercent / 100}`,
    };

    setRangeSliderStyleValue(
        style,
        '--_rp-range-slider-color',
        getComponentColorValue(props.color),
    );

    for (const [property, propName, getValue] of rangeSliderThumbStyleProps) {
        setRangeSliderStyleValue(style, property, getValue(props.thumbStyle?.[propName]));
    }

    return style;
}

function getRangeSliderMarkStyle(percent: number, color: SliderMark['color']) {
    const style: CSSProperties = {
        '--_rp-range-slider-mark-position': `${percent}%`,
    };
    const colorValue = getComponentColorValue(color);

    for (const property of rangeSliderMarkColorProperties) {
        setRangeSliderStyleValue(style, property, colorValue);
    }

    return style;
}

function normalizeRangeSliderMark(mark: SliderMarkInput): SliderMark {
    return typeof mark === 'number' ? { value: mark } : mark;
}

function normalizeRangeSliderMarks(
    marks: SliderMarkInput[] | undefined,
    min: number,
    max: number,
    value: RangeSliderValue,
) {
    return (marks ?? []).flatMap((markInput, index) => {
        const mark = normalizeRangeSliderMark(markInput);
        if (mark.hidden) return [];

        const markValue = Number(mark.value);
        if (!Number.isFinite(markValue)) return [];

        const percent = getSliderValuePercent(markValue, min, max);

        return {
            key: `${markValue}-${index}`,
            value: markValue,
            label: mark.label,
            hasLabel: mark.label != null,
            filled: markValue >= value[0] && markValue <= value[1],
            style: getRangeSliderMarkStyle(percent, mark.color),
        };
    });
}

function getFormattedRangeSliderValue(
    value: RangeSliderValue,
    formatter: RangeSliderProps['formatValue'],
): [string | number, string | number] {
    return formatter ? [formatter(value[0]), formatter(value[1])] : value;
}

function getRangeSliderEndpointValueText(
    value: number,
    ariaValueText: RangeSliderEndpointValueText | undefined,
    formatter: RangeSliderProps['formatValue'],
) {
    if (typeof ariaValueText === 'function') return String(ariaValueText(value));
    if (ariaValueText != null && ariaValueText !== '') return String(ariaValueText);
    if (formatter) return String(formatter(value));

    return undefined;
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
        getRangeSliderEndpointValueText(value[0], endpointValues[0], formatter),
        getRangeSliderEndpointValueText(value[1], endpointValues[1], formatter),
    ];
}

function getRangeSliderTooltipOptions(
    tooltip: NonNullable<RangeSliderProps['tooltip']>,
): SliderTooltipOptions {
    return typeof tooltip === 'object' ? tooltip : {};
}

function getRangeSliderTooltipMode(
    tooltip: NonNullable<RangeSliderProps['tooltip']>,
): SliderTooltipMode | false {
    if (tooltip === false) return false;
    if (typeof tooltip === 'object') return tooltip.mode ?? 'hover';

    return tooltip;
}

function getThumbIndex(thumb: RangeSliderThumb) {
    return thumb === 'lower' ? 0 : 1;
}

function getThumbFromTarget(target: EventTarget | null) {
    const element = target as Element | null;
    const thumb = element
        ?.closest?.('[data-range-slider-thumb]')
        ?.getAttribute('data-range-slider-thumb');

    return thumb === 'lower' || thumb === 'upper' ? thumb : undefined;
}

function focusThumb(track: HTMLElement, thumb: RangeSliderThumb) {
    const input = track.querySelector<HTMLInputElement>(
        `.rp-range-slider__native--${thumb}, input[data-range-slider-thumb="${thumb}"]`,
    );
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
    const nativeMin = computed<RangeSliderValue>(() => [
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
    ]);
    const nativeMax = computed<RangeSliderValue>(() => [
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
    ]);
    const markItems = computed(() =>
        normalizeRangeSliderMarks(
            props.marks,
            bounds.value.min,
            bounds.value.max,
            normalizedValue.value,
        ),
    );
    const hasMarkLabels = computed(() => markItems.value.some((mark) => mark.hasLabel));
    const trackStyle = computed<CSSProperties>(() =>
        getRangeSliderTrackStyle(props, valuePercent.value),
    );

    const tooltipOptions = computed(() => getRangeSliderTooltipOptions(props.tooltip));
    const tooltipMode = computed(() => getRangeSliderTooltipMode(props.tooltip));
    const tooltipOpenDelay = computed(() => tooltipOptions.value.openDelay ?? 0);
    const delayedTooltip = useDelayedOpen({
        openDelay: () => tooltipOpenDelay.value,
        disabled: () => tooltipMode.value !== 'hover' || control.disabled,
    });
    const tooltipInteractionReasons = ref<Record<RangeSliderThumb, TooltipInteractionReasons>>({
        lower: { focus: false, drag: false },
        upper: { focus: false, drag: false },
    });
    const tooltipTrackHovered = ref(false);
    const tooltipDismissed = ref(false);
    const tooltipVisible = computed(() => tooltipMode.value !== false);
    const tooltipAlwaysVisible = computed(() => tooltipMode.value === 'always');
    const tooltipOpen = computed(
        () =>
            tooltipAlwaysVisible.value ||
            (tooltipMode.value === 'hover' &&
                delayedTooltip.isOpen.value &&
                hasAnyTooltipInteractionReason() &&
                !tooltipDismissed.value &&
                !control.disabled),
    );
    const tooltipPlacement = computed(
        () => tooltipOptions.value.placement ?? (props.orientation === 'vertical' ? 'left' : 'top'),
    );
    const tooltipIds = computed<[string | undefined, string | undefined]>(() => {
        const baseId = tooltipOptions.value.id;
        return baseId ? [`${baseId}-lower`, `${baseId}-upper`] : [undefined, undefined];
    });
    const tooltipColor = computed(() => tooltipOptions.value.color);
    const tooltipOffset = computed(() => tooltipOptions.value.offset);
    const tooltipArrow = computed(() => tooltipOptions.value.arrow ?? false);
    const tooltipContent = computed<[string, string]>(() => [
        String(formattedValue.value[0]),
        String(formattedValue.value[1]),
    ]);

    const rootClass = computed(() =>
        bem('rp-range-slider', {
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

    function getAllowedValue(value: number, thumb: RangeSliderThumb) {
        const safeValue = normalizeSliderValue(
            value,
            bounds.value.min,
            bounds.value.max,
            valueStep.value,
        );

        if (thumb === 'lower') {
            return Math.min(safeValue, nativeMax.value[0]);
        }

        return Math.max(safeValue, nativeMin.value[1]);
    }

    function updateThumb(thumb: RangeSliderThumb, value: number) {
        if (control.disabled) return;

        activeThumb.value = thumb;
        const nextValue: RangeSliderValue = [...normalizedValue.value];
        nextValue[getThumbIndex(thumb)] = getAllowedValue(value, thumb);
        emitUpdate(nextValue);
    }

    function onInput(thumb: RangeSliderThumb, event: Event) {
        const input = event.target as HTMLInputElement;
        updateThumb(thumb, input.valueAsNumber);
    }

    function hasThumbTooltipInteractionReason(thumb: RangeSliderThumb) {
        const reasons = tooltipInteractionReasons.value[thumb];
        return reasons.focus || reasons.drag;
    }

    function hasAnyTooltipInteractionReason() {
        return (
            tooltipTrackHovered.value ||
            hasThumbTooltipInteractionReason('lower') ||
            hasThumbTooltipInteractionReason('upper')
        );
    }

    function syncTooltip() {
        if (
            tooltipMode.value === 'hover' &&
            !control.disabled &&
            hasAnyTooltipInteractionReason() &&
            !tooltipDismissed.value
        ) {
            delayedTooltip.open();
            return;
        }

        delayedTooltip.closeImmediate();
    }

    function startTooltipInteraction(thumb: RangeSliderThumb, reason: TooltipInteractionReason) {
        activeThumb.value = thumb;
        const wasActive = hasAnyTooltipInteractionReason();
        const wasDismissed = tooltipDismissed.value;
        tooltipInteractionReasons.value[thumb][reason] = true;
        tooltipDismissed.value = false;

        if (!wasActive || wasDismissed) syncTooltip();
    }

    function endTooltipInteraction(thumb: RangeSliderThumb, reason: TooltipInteractionReason) {
        tooltipInteractionReasons.value[thumb][reason] = false;
        if (!hasAnyTooltipInteractionReason()) syncTooltip();
    }

    function resetTooltipInteractionReasons(thumb: RangeSliderThumb) {
        const reasons = tooltipInteractionReasons.value[thumb];
        reasons.focus = false;
        reasons.drag = false;
    }

    function clearTooltipInteractions(thumb: RangeSliderThumb) {
        resetTooltipInteractionReasons(thumb);
        syncTooltip();
    }

    function resumeDismissedTooltip(thumb: RangeSliderThumb) {
        activeThumb.value = thumb;
        if (!tooltipDismissed.value) return;

        tooltipDismissed.value = false;
        syncTooltip();
    }

    function dismissTooltip() {
        tooltipDismissed.value = true;
        delayedTooltip.closeImmediate();
    }

    function onTooltipFocus(thumb: RangeSliderThumb) {
        startTooltipInteraction(thumb, 'focus');
    }

    function onTooltipBlur(thumb: RangeSliderThumb) {
        endTooltipInteraction(thumb, 'focus');
    }

    function onTooltipTrackMouseEnter() {
        const wasActive = hasAnyTooltipInteractionReason();
        const wasDismissed = tooltipDismissed.value;
        tooltipTrackHovered.value = true;
        tooltipDismissed.value = false;

        if (!wasActive || wasDismissed) syncTooltip();
    }

    function onTooltipTrackMouseLeave() {
        tooltipTrackHovered.value = false;
        if (!hasAnyTooltipInteractionReason()) syncTooltip();
    }

    function openTooltip(thumb: RangeSliderThumb) {
        startTooltipInteraction(thumb, 'focus');
    }

    function closeTooltip(thumb?: RangeSliderThumb) {
        if (thumb) {
            clearTooltipInteractions(thumb);
            return;
        }

        resetTooltipInteractionReasons('lower');
        resetTooltipInteractionReasons('upper');
        tooltipTrackHovered.value = false;
        syncTooltip();
    }

    function onTooltipKeydown(thumb: RangeSliderThumb, event: KeyboardEvent) {
        activeThumb.value = thumb;
        if (event.key === 'Escape') {
            dismissTooltip();
            return;
        }

        resumeDismissedTooltip(thumb);
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
        updateThumb(thumb, nextValue);
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

    let dragWindow: Window | null = null;
    let dragTrack: HTMLElement | null = null;
    let dragThumb: RangeSliderThumb | null = null;
    let dragPointerId: number | undefined;

    function stopDragging() {
        const stoppedThumb = dragThumb;
        if (dragWindow) {
            dragWindow.removeEventListener('pointermove', onPointerMove);
            dragWindow.removeEventListener('pointerup', onPointerEnd);
            dragWindow.removeEventListener('pointercancel', onPointerEnd);
        }

        dragWindow = null;
        dragTrack = null;
        dragThumb = null;
        dragPointerId = undefined;

        if (stoppedThumb) endTooltipInteraction(stoppedThumb, 'drag');
    }

    function updateFromPointer(event: PointerEvent, track: HTMLElement, thumb: RangeSliderThumb) {
        const value = getValueFromPointer(event, track);
        if (value == null) return;

        updateThumb(thumb, value);
    }

    function onPointerMove(event: PointerEvent) {
        if (dragPointerId !== undefined && event.pointerId !== dragPointerId) return;

        if (!dragTrack || !dragThumb) {
            stopDragging();
            return;
        }

        updateFromPointer(event, dragTrack, dragThumb);
    }

    function onPointerEnd(event: PointerEvent) {
        if (dragPointerId !== undefined && event.pointerId !== dragPointerId) return;

        stopDragging();
    }

    function onTrackPointerDown(event: PointerEvent) {
        if (control.disabled || event.button !== 0 || event.isPrimary === false) return;

        const track = event.currentTarget as HTMLElement | null;
        if (!track) return;

        const pointerValue = getValueFromPointer(event, track);
        if (pointerValue == null) return;

        const thumb =
            getThumbFromTarget(event.target) ??
            getClosestRangeSliderThumb(pointerValue, normalizedValue.value, activeThumb.value);

        event.preventDefault();
        stopDragging();
        activeThumb.value = thumb;
        focusThumb(track, thumb);

        dragTrack = track;
        dragThumb = thumb;
        dragPointerId = Number.isFinite(event.pointerId) ? event.pointerId : undefined;
        dragWindow = track.ownerDocument.defaultView;
        startTooltipInteraction(thumb, 'drag');
        updateFromPointer(event, track, thumb);
        dragWindow?.addEventListener('pointermove', onPointerMove);
        dragWindow?.addEventListener('pointerup', onPointerEnd);
        dragWindow?.addEventListener('pointercancel', onPointerEnd);
    }

    watch([tooltipMode, () => control.disabled], () => {
        syncTooltip();
    });

    onBeforeUnmount(stopDragging);

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
        tooltipColor,
        tooltipOffset,
        tooltipOpenDelay,
        tooltipArrow,
        tooltipContent,
        onInput,
        onTrackPointerDown,
        onTooltipFocus,
        onTooltipBlur,
        onTooltipTrackMouseEnter,
        onTooltipTrackMouseLeave,
        openTooltip,
        closeTooltip,
        onTooltipKeydown,
    };
}
