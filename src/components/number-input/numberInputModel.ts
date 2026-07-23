import type { NumberInputControlsPosition, NumberInputTextAlign, NumberInputValue } from './types';

export interface NumberInputBounds {
    min: number | undefined;
    max: number | undefined;
}

export type NumberInputControl = 'decrement' | 'increment';

export type NumberInputStepDirection = -1 | 1;

function finiteOrUndefined(value: number | undefined) {
    return value !== undefined && Number.isFinite(value) ? value : undefined;
}

function normalizeZero(value: number) {
    return Object.is(value, -0) ? 0 : value;
}

function getDecimalPlaces(value: number) {
    const [coefficient = '', exponentText] = String(value).toLowerCase().split('e');
    const fractionLength = coefficient.split('.')[1]?.length ?? 0;
    const exponent = Number(exponentText ?? 0);

    return Math.max(0, fractionLength - (Number.isFinite(exponent) ? exponent : 0));
}

function roundWithPrecision(value: number, ...operands: number[]) {
    const precision = Math.min(15, Math.max(0, ...operands.map(getDecimalPlaces)));
    return normalizeZero(Number(value.toFixed(precision)));
}

export function normalizeNumberInputBounds(
    min: number | undefined,
    max: number | undefined,
): NumberInputBounds {
    const safeMin = finiteOrUndefined(min);
    const safeMax = finiteOrUndefined(max);

    if (safeMin !== undefined && safeMax !== undefined && safeMax < safeMin) {
        return { min: safeMax, max: safeMin };
    }

    return { min: safeMin, max: safeMax };
}

export function normalizeNumberInputStep(step: number | undefined) {
    return step !== undefined && Number.isFinite(step) && step > 0 ? step : 1;
}

export function clampNumberInputValue(value: number, bounds: NumberInputBounds) {
    const aboveMin = bounds.min === undefined ? value : Math.max(bounds.min, value);
    const withinBounds = bounds.max === undefined ? aboveMin : Math.min(bounds.max, aboveMin);

    return normalizeZero(withinBounds);
}

export function stepNumberInputValue(
    value: NumberInputValue,
    direction: NumberInputStepDirection,
    step: number,
    bounds: NumberInputBounds,
) {
    const current = value ?? 0;
    const rawNext = current + direction * step;

    if (!Number.isFinite(rawNext)) {
        if (direction === 1 && bounds.max !== undefined) return bounds.max;
        if (direction === -1 && bounds.min !== undefined) return bounds.min;
        return normalizeZero(current);
    }

    const next = roundWithPrecision(rawNext, current, step);

    return clampNumberInputValue(next, bounds);
}

export function parseNumberInputValue(value: string): NumberInputValue {
    if (value === '') return null;

    const parsed = Number(value);
    return Number.isFinite(parsed) ? normalizeZero(parsed) : null;
}

export function normalizeNumberInputControlsPosition(
    position: NumberInputControlsPosition | undefined,
): NumberInputControlsPosition {
    return position === 'left' || position === 'split' ? position : 'right';
}

export function normalizeNumberInputTextAlign(
    textAlign: NumberInputTextAlign | undefined,
): NumberInputTextAlign {
    return textAlign === 'center' || textAlign === 'right' ? textAlign : 'left';
}

export function getModelInputValue(value: NumberInputValue) {
    return value !== null && Number.isFinite(value) ? String(normalizeZero(value)) : '';
}
