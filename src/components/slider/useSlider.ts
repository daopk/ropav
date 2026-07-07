import { computed, ref, type CSSProperties } from 'vue';
import { useControlState } from '@/composables/useControlState';
import { bem } from '@/utils/bem';
import { sliderColors } from './types';
import type { SliderMark, SliderMarkInput, SliderProps } from './types';

type SliderStateProps = Readonly<
    SliderProps & {
        min: number;
        max: number;
        step: number | 'any';
        tooltip: NonNullable<SliderProps['tooltip']>;
        orientation: NonNullable<SliderProps['orientation']>;
    }
>;

const sliderColorNames = new Set<string>(sliderColors);

const sliderMarkColorProperties = [
    '--_rp-slider-mark-color',
    '--_rp-slider-mark-label-color',
    '--_rp-slider-mark-filled-label-color',
    '--_rp-slider-mark-ring-color',
] as const;

export function normalizeSliderValue(
    value: number,
    min: number,
    max: number,
    step: number | 'any',
) {
    const bounds = normalizeSliderBounds(min, max);
    const safeStep = normalizeSliderStep(step);
    const safeValue = Number.isFinite(value) ? value : bounds.min;
    const clamped = Math.min(bounds.max, Math.max(bounds.min, safeValue));

    if (safeStep === 'any') return clamped;

    const steps = Math.round((clamped - bounds.min) / safeStep);
    const snapped = bounds.min + steps * safeStep;

    return Math.min(bounds.max, Math.max(bounds.min, Number(snapped.toFixed(10))));
}

export function normalizeSliderBounds(min: number, max: number) {
    const safeMin = Number.isFinite(min) ? min : 0;
    const safeMax = Number.isFinite(max) ? max : safeMin;

    return safeMax >= safeMin ? { min: safeMin, max: safeMax } : { min: safeMax, max: safeMin };
}

export function normalizeSliderStep(step: number | 'any') {
    return step === 'any' || (Number.isFinite(step) && step > 0) ? step : 'any';
}

export function getSliderValuePercent(value: number, min: number, max: number) {
    if (max <= min) return 0;

    const percent = ((value - min) / (max - min)) * 100;
    return Math.min(100, Math.max(0, percent));
}

function getSliderMarkColorValue(color: SliderMark['color']) {
    if (!color) return undefined;

    return sliderColorNames.has(color) ? `var(--rp-color-${color})` : color;
}

function isSliderPresetColor(color: SliderProps['color']) {
    return Boolean(color && sliderColorNames.has(color));
}

function getSliderCustomColorValue(color: SliderProps['color']) {
    if (!color || isSliderPresetColor(color)) return undefined;

    return color;
}

function setSliderStyleValue(
    style: CSSProperties,
    property: `--_rp-slider-${string}`,
    value: string | undefined,
) {
    if (value) {
        style[property] = value;
    }
}

function getSliderMarkStyle(percent: number, color: SliderMark['color']) {
    const style: CSSProperties = {
        '--_rp-slider-mark-position': `${percent}%`,
    };
    const colorValue = getSliderMarkColorValue(color);

    for (const property of sliderMarkColorProperties) {
        setSliderStyleValue(style, property, colorValue);
    }

    return style;
}

function normalizeSliderMark(mark: SliderMarkInput): SliderMark {
    return typeof mark === 'number' ? { value: mark } : mark;
}

function normalizeSliderMarks(
    marks: SliderMarkInput[] | undefined,
    min: number,
    max: number,
    valuePercent: number,
) {
    return (marks ?? []).flatMap((markInput, index) => {
        const mark = normalizeSliderMark(markInput);
        if (mark.hidden) return [];

        const value = Number(mark.value);
        if (!Number.isFinite(value)) return [];

        const percent = getSliderValuePercent(value, min, max);

        return {
            key: `${value}-${index}`,
            value,
            label: mark.label,
            hasLabel: mark.label != null,
            filled: percent <= valuePercent,
            style: getSliderMarkStyle(percent, mark.color),
        };
    });
}

function getSliderLengthValue(value: number | string | undefined) {
    if (value == null || value === '') return undefined;
    if (typeof value === 'number') return Number.isFinite(value) ? `${value}px` : undefined;

    return value;
}

function getSliderBorderValue(value: number | string | undefined) {
    if (value == null || value === '') return undefined;
    if (typeof value === 'number') {
        return Number.isFinite(value)
            ? `${value}px solid var(--_rp-slider-thumb-border)`
            : undefined;
    }

    return value;
}

const sliderThumbStyleProps = [
    ['--_rp-slider-thumb-size', 'size', getSliderLengthValue],
    ['--_rp-slider-thumb-border-style', 'border', getSliderBorderValue],
    ['--_rp-slider-thumb-padding', 'padding', getSliderLengthValue],
] as const;

function getSliderTrackStyle(props: SliderStateProps, valuePercent: number) {
    const style: CSSProperties = {
        '--_rp-slider-percent': `${valuePercent}%`,
        '--_rp-slider-ratio': `${valuePercent / 100}`,
    };

    setSliderStyleValue(style, '--_rp-slider-custom-color', getSliderCustomColorValue(props.color));

    for (const [property, propName, getValue] of sliderThumbStyleProps) {
        setSliderStyleValue(style, property, getValue(props.thumbStyle?.[propName]));
    }

    return style;
}

function getFormattedSliderValue(value: number, formatter: SliderProps['formatValue']) {
    return formatter ? formatter(value) : value;
}

function getSliderAriaValueText(
    value: number,
    ariaValueText: SliderProps['ariaValueText'],
    formatter: SliderProps['formatValue'],
) {
    if (typeof ariaValueText === 'function') return String(ariaValueText(value));
    if (ariaValueText != null && ariaValueText !== '') return String(ariaValueText);
    if (formatter) return String(formatter(value));

    return undefined;
}

export function useSlider(props: SliderStateProps, emitUpdate: (value: number) => void) {
    const control = useControlState(props);
    const hoveredTooltipOpen = ref(false);

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
        normalizeSliderMarks(props.marks, bounds.value.min, bounds.value.max, valuePercent.value),
    );

    const hasMarkLabels = computed(() => markItems.value.some((mark) => mark.hasLabel));
    const tooltipVisible = computed(() => props.tooltip !== false);
    const tooltipAlwaysVisible = computed(() => props.tooltip === 'always');
    const tooltipOpen = computed(
        () =>
            tooltipAlwaysVisible.value ||
            (props.tooltip === 'hover' && hoveredTooltipOpen.value && !control.disabled),
    );
    const tooltipPlacement = computed(() => (props.orientation === 'vertical' ? 'left' : 'top'));
    const tooltipContent = computed(() => String(formattedValue.value));

    const rootClass = computed(() =>
        bem('rp-slider', {
            [`color-${props.color}`]: isSliderPresetColor(props.color),
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
        if (props.tooltip === 'hover' && !control.disabled) {
            hoveredTooltipOpen.value = true;
        }
    }

    function closeTooltip() {
        hoveredTooltipOpen.value = false;
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
        tooltipContent,
        onInput,
        openTooltip,
        closeTooltip,
        onTooltipKeydown,
    };
}
