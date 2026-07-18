import type { CSSProperties } from 'vue';
import { getComponentColorValue } from '@/utils/componentColors';
import type {
    RangeSliderTooltip,
    RangeSliderThumbOptions,
    SliderMark,
    SliderMarkInput,
    SliderProps,
    SliderThumb,
    SliderThumbMode,
    SliderThumbOptions,
    SliderTooltip,
    SliderTooltipAnchor,
    SliderTooltipMode,
    SliderTooltipOptions,
} from './types';

export interface SliderBounds {
    min: number;
    max: number;
}

interface SliderMarkStyleProperties {
    position: `--_rp-${string}`;
    colors: readonly `--_rp-${string}`[];
}

interface SliderThumbStyleProperties {
    size: `--${string}`;
    border: `--${string}`;
    padding: `--${string}`;
    borderColor: `--_rp-${string}`;
}

export function normalizeSliderBounds(min: number, max: number): SliderBounds {
    const safeMin = Number.isFinite(min) ? min : 0;
    const safeMax = Number.isFinite(max) ? max : safeMin;

    return safeMax >= safeMin ? { min: safeMin, max: safeMax } : { min: safeMax, max: safeMin };
}

export function normalizeSliderStep(step: number | 'any') {
    return step === 'any' || (Number.isFinite(step) && step > 0) ? step : 'any';
}

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

export function getSliderValuePercent(value: number, min: number, max: number) {
    if (!Number.isFinite(value) || max <= min) return 0;

    const percent = ((value - min) / (max - min)) * 100;
    return Math.min(100, Math.max(0, percent));
}

export function setSliderStyleValue(
    style: CSSProperties,
    property: `--${string}`,
    value: string | undefined,
) {
    if (value) style[property] = value;
}

function getSliderLengthValue(value: number | string | undefined) {
    if (value == null || value === '') return undefined;
    if (typeof value === 'number') return Number.isFinite(value) ? `${value}px` : undefined;

    return value;
}

function getSliderBorderValue(
    value: number | string | undefined,
    borderColorProperty: `--_rp-${string}`,
) {
    if (value == null || value === '') return undefined;
    if (typeof value === 'number') {
        return Number.isFinite(value) ? `${value}px solid var(${borderColorProperty})` : undefined;
    }

    return value;
}

export function applySliderThumbStyle(
    style: CSSProperties,
    thumb: RangeSliderThumbOptions | undefined,
    properties: SliderThumbStyleProperties,
) {
    setSliderStyleValue(style, properties.size, getSliderLengthValue(thumb?.size));
    setSliderStyleValue(
        style,
        properties.border,
        getSliderBorderValue(thumb?.border, properties.borderColor),
    );
    setSliderStyleValue(style, properties.padding, getSliderLengthValue(thumb?.padding));
}

export function getSliderThumbOptions(thumb: SliderThumb): SliderThumbOptions {
    return typeof thumb === 'object' ? thumb : {};
}

export function getSliderThumbMode(thumb: SliderThumb): SliderThumbMode | false {
    if (thumb === false) return false;
    if (typeof thumb === 'object') return thumb.visibility ?? 'always';

    return thumb;
}

function getSliderMarkStyle(
    percent: number,
    color: SliderMark['color'],
    properties: SliderMarkStyleProperties,
) {
    const style: CSSProperties = { [properties.position]: `${percent}%` };
    const colorValue = getComponentColorValue(color);

    for (const property of properties.colors) {
        setSliderStyleValue(style, property, colorValue);
    }

    return style;
}

export function createSliderMarkItems(
    marks: SliderMarkInput[] | undefined,
    min: number,
    max: number,
    isFilled: (value: number, percent: number) => boolean,
    properties: SliderMarkStyleProperties,
) {
    return (marks ?? []).flatMap((markInput, index) => {
        const mark = typeof markInput === 'number' ? { value: markInput } : markInput;
        if (mark.hidden) return [];

        const value = Number(mark.value);
        if (!Number.isFinite(value)) return [];

        const percent = getSliderValuePercent(value, min, max);

        return {
            key: `${value}-${index}`,
            value,
            label: mark.label,
            hasLabel: mark.label != null,
            filled: isFilled(value, percent),
            style: getSliderMarkStyle(percent, mark.color, properties),
        };
    });
}

export function getFormattedSliderValue(value: number, formatter: SliderProps['formatValue']) {
    return formatter ? formatter(value) : value;
}

export function getSliderAriaValueText(
    value: number,
    ariaValueText: string | SliderProps['formatValue'] | undefined,
    formatter: SliderProps['formatValue'],
) {
    if (typeof ariaValueText === 'function') return String(ariaValueText(value));
    if (ariaValueText != null && ariaValueText !== '') return String(ariaValueText);
    if (formatter) return String(formatter(value));

    return undefined;
}

export function getSliderTooltipOptions(
    tooltip: SliderTooltip | RangeSliderTooltip,
): SliderTooltipOptions | Exclude<RangeSliderTooltip, false | SliderTooltipMode> {
    return typeof tooltip === 'object' ? tooltip : {};
}

export function getSliderTooltipMode(
    tooltip: SliderTooltip | RangeSliderTooltip,
): SliderTooltipMode | false {
    if (tooltip === false) return false;
    if (typeof tooltip === 'object') {
        if ('anchor' in tooltip && tooltip.anchor === 'pointer') return 'hover';
        return tooltip.mode ?? 'hover';
    }

    return tooltip;
}

export function getSliderTooltipAnchor(tooltip: SliderTooltip): SliderTooltipAnchor {
    return typeof tooltip === 'object' && tooltip.anchor === 'pointer' ? 'pointer' : 'thumb';
}
