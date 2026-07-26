import { describe, expect, it } from 'vitest';
import { toCssLength, toPositiveCssLength } from './css';

describe('CSS utilities', () => {
    it.each([
        [12, '12px'],
        [0, '0px'],
        [-4, '-4px'],
        [' 1.5rem ', '1.5rem'],
        ['calc(100% - 2px)', 'calc(100% - 2px)'],
        ['', undefined],
        ['   ', undefined],
        [Number.NaN, undefined],
        [Number.POSITIVE_INFINITY, undefined],
        [null, undefined],
        [undefined, undefined],
    ])('normalizes CSS length %j', (value, expected) => {
        expect(toCssLength(value)).toBe(expected);
    });

    it('rejects non-positive numeric lengths without parsing valid CSS strings', () => {
        expect(toPositiveCssLength(0)).toBeUndefined();
        expect(toPositiveCssLength(-1)).toBeUndefined();
        expect(toPositiveCssLength(8)).toBe('8px');
        expect(toPositiveCssLength('0')).toBe('0');
        expect(toPositiveCssLength('clamp(0px, 1vw, 8px)')).toBe('clamp(0px, 1vw, 8px)');
    });
});
