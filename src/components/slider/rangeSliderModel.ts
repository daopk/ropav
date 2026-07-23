import { clamp } from '@/utils/number';
import type {
    RangeSliderEndpointValueText,
    RangeSliderProps,
    RangeSliderThumb,
    RangeSliderValue,
} from './types';
import {
    getFormattedSliderValue,
    getSliderAriaValueText,
    normalizeSliderBounds,
    normalizeSliderStep,
    normalizeSliderValue,
    type SliderBounds,
} from './sliderModel';

export interface RangeSliderPointerGeometry {
    length: number;
    start: number;
    vertical: boolean;
}

export interface RangeSliderPointerCoordinates {
    clientX: number;
    clientY: number;
}

interface RangeSliderThumbUpdateOptions {
    thumb: RangeSliderThumb;
    value: number;
    currentValue: RangeSliderValue;
    bounds: SliderBounds;
    step: number | 'any';
    minRange: number;
    nativeMin: RangeSliderValue;
    nativeMax: RangeSliderValue;
    anchorValue?: number;
}

function roundSliderNumber(value: number) {
    return Number(value.toFixed(10));
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

export function getRangeSliderNativeStep(bounds: SliderBounds, step: number | 'any') {
    if (step === 'any') return step;
    return isSliderStepAligned(bounds.min, bounds.max, step) ? step : 'any';
}

export function getRangeSliderNativeLimits(
    value: RangeSliderValue,
    bounds: SliderBounds,
    step: number | 'any',
    minRange: number,
) {
    if (minRange === 0) {
        return {
            min: [bounds.min, bounds.min] as RangeSliderValue,
            max: [bounds.max, bounds.max] as RangeSliderValue,
        };
    }

    return {
        min: [
            bounds.min,
            clamp(
                getStepValueAtOrAbove(value[0] + minRange, bounds.min, step),
                bounds.min,
                bounds.max,
            ),
        ] as RangeSliderValue,
        max: [
            clamp(
                getStepValueAtOrBelow(value[1] - minRange, bounds.min, step),
                bounds.min,
                bounds.max,
            ),
            bounds.max,
        ] as RangeSliderValue,
    };
}

export function getRangeSliderThumbUpdate({
    thumb,
    value,
    currentValue,
    bounds,
    step,
    minRange,
    nativeMin,
    nativeMax,
    anchorValue = currentValue[getRangeSliderThumbIndex(getOppositeRangeSliderThumb(thumb))],
}: RangeSliderThumbUpdateOptions) {
    const safeValue = normalizeSliderValue(value, bounds.min, bounds.max, step);

    if (minRange > 0) {
        const nextValue: RangeSliderValue = [...currentValue];
        nextValue[getRangeSliderThumbIndex(thumb)] =
            thumb === 'lower'
                ? Math.min(safeValue, nativeMax[0])
                : Math.max(safeValue, nativeMin[1]);

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

export function getFormattedRangeSliderValue(
    value: RangeSliderValue,
    formatter: RangeSliderProps['formatValue'],
): [string | number, string | number] {
    return [
        getFormattedSliderValue(value[0], formatter),
        getFormattedSliderValue(value[1], formatter),
    ];
}

export function getRangeSliderAriaValueText(
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

export function getRangeSliderThumbIndex(thumb: RangeSliderThumb) {
    return thumb === 'lower' ? 0 : 1;
}

export function getOppositeRangeSliderThumb(thumb: RangeSliderThumb): RangeSliderThumb {
    return thumb === 'lower' ? 'upper' : 'lower';
}

export function getRangeSliderKeyboardValue(
    key: string,
    currentValue: number,
    step: number,
    min: number,
    max: number,
) {
    switch (key) {
        case 'ArrowRight':
        case 'ArrowUp':
            return currentValue + step;
        case 'ArrowLeft':
        case 'ArrowDown':
            return currentValue - step;
        case 'PageUp':
            return currentValue + step * 10;
        case 'PageDown':
            return currentValue - step * 10;
        case 'Home':
            return min;
        case 'End':
            return max;
        default:
            return undefined;
    }
}

export function getRangeSliderPointerValue(
    pointer: RangeSliderPointerCoordinates,
    geometry: RangeSliderPointerGeometry,
    bounds: SliderBounds,
) {
    const pointerPosition = geometry.vertical ? pointer.clientY : pointer.clientX;
    const offset = geometry.vertical
        ? geometry.start - pointerPosition
        : pointerPosition - geometry.start;
    const ratio = clamp(offset / geometry.length, 0, 1);
    return bounds.min + ratio * (bounds.max - bounds.min);
}
