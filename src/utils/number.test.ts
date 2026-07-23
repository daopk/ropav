import { describe, expect, it } from 'vitest';
import { clamp, getValuePercent, roundTo } from './number';

describe('number utilities', () => {
    it('clamps values to inclusive bounds', () => {
        expect(clamp(-1, 0, 10)).toBe(0);
        expect(clamp(4, 0, 10)).toBe(4);
        expect(clamp(11, 0, 10)).toBe(10);
    });

    it('maps finite range values to a clamped percentage', () => {
        expect(getValuePercent(25, 0, 200)).toBe(12.5);
        expect(getValuePercent(-1, 0, 100)).toBe(0);
        expect(getValuePercent(101, 0, 100)).toBe(100);
        expect(getValuePercent(Number.NaN, 0, 100)).toBe(0);
        expect(getValuePercent(10, 5, 5)).toBe(0);
    });

    it('rounds to a requested number of fractional digits', () => {
        expect(roundTo(1.234)).toBe(1.23);
        expect(roundTo(1.235)).toBe(1.24);
        expect(roundTo(1.2345, 3)).toBe(1.235);
    });
});
