import { describe, expect, it } from 'vitest';
import {
    formatProgressValue,
    getProgressAriaValueText,
    normalizeProgressBounds,
    normalizeProgressValue,
} from './progressModel';

const progressFormatter = (value: number, percent: number) => `${value} of ${percent}%`;

describe('progress model', () => {
    it('normalizes finite bounds and reverses inverted ranges', () => {
        expect(normalizeProgressBounds(100, 0)).toEqual({ min: 0, max: 100 });
        expect(normalizeProgressBounds(Number.NaN, Number.POSITIVE_INFINITY)).toEqual({
            min: 0,
            max: 100,
        });
        expect(normalizeProgressBounds(20, 120)).toEqual({ min: 20, max: 120 });
    });

    it('normalizes invalid values and clamps finite values to the range', () => {
        expect(normalizeProgressValue(null, 20, 120)).toBe(20);
        expect(normalizeProgressValue(Number.NaN, 20, 120)).toBe(20);
        expect(normalizeProgressValue(0, 20, 120)).toBe(20);
        expect(normalizeProgressValue(140, 20, 120)).toBe(120);
        expect(normalizeProgressValue(64, 20, 120)).toBe(64);
    });

    it('formats values with a custom formatter or the default percentage', () => {
        expect(formatProgressValue(64, 63.6, undefined)).toBe('64%');
        expect(formatProgressValue(64, 64, (value, percent) => `${value} of ${percent}%`)).toBe(
            '64 of 64%',
        );
    });

    it('resolves accessible value text by documented precedence', () => {
        expect(getProgressAriaValueText(64, 64, '64 files uploaded', progressFormatter)).toBe(
            '64 files uploaded',
        );
        expect(getProgressAriaValueText(64, 64, (value) => value, progressFormatter)).toBe('64');
        expect(getProgressAriaValueText(64, 64, '', progressFormatter)).toBe('64 of 64%');
        expect(getProgressAriaValueText(64, 64, undefined, undefined)).toBeUndefined();
    });
});
