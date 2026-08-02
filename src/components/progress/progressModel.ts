import { clamp } from '@/utils/number';
import type { ProgressProps } from './types';

export function normalizeProgressBounds(min: number, max: number) {
    const safeMin = Number.isFinite(min) ? min : 0;
    const safeMax = Number.isFinite(max) ? max : 100;

    return safeMax >= safeMin ? { min: safeMin, max: safeMax } : { min: safeMax, max: safeMin };
}

export function normalizeProgressValue(value: number | null | undefined, min: number, max: number) {
    const safeValue = Number.isFinite(value) ? Number(value) : min;

    return clamp(safeValue, min, max);
}

export function formatProgressValue(
    value: number,
    percent: number,
    formatter: ProgressProps['formatValue'],
) {
    return formatter ? formatter(value, percent) : `${Math.round(percent)}%`;
}

export function getProgressAriaValueText(
    value: number,
    percent: number,
    ariaValueText: ProgressProps['ariaValueText'],
    formatter: ProgressProps['formatValue'],
) {
    if (typeof ariaValueText === 'function') return String(ariaValueText(value, percent));
    if (ariaValueText != null && ariaValueText !== '') return String(ariaValueText);
    if (formatter) return String(formatter(value, percent));

    return undefined;
}
