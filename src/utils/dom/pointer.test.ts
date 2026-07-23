import { describe, expect, it } from 'vitest';
import { getPointerId, isMatchingPointer } from './pointer';

describe('pointer utilities', () => {
    it('normalizes finite pointer identifiers', () => {
        expect(getPointerId({ pointerId: 4 })).toBe(4);
        expect(getPointerId({ pointerId: Number.NaN })).toBeUndefined();
        expect(getPointerId({ pointerId: Number.POSITIVE_INFINITY })).toBeUndefined();
    });

    it('matches a captured pointer while allowing environments without an identifier', () => {
        expect(isMatchingPointer({ pointerId: 4 }, 4)).toBe(true);
        expect(isMatchingPointer({ pointerId: 5 }, 4)).toBe(false);
        expect(isMatchingPointer({ pointerId: 5 }, undefined)).toBe(true);
        expect(isMatchingPointer({ pointerId: Number.NaN }, 4)).toBe(false);
    });
});
