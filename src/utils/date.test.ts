import { describe, expect, it } from 'vitest';
import { normalizeDate } from './date';

describe('date', () => {
    it('normalizes valid dates to local midnight', () => {
        const source = new Date(2026, 6, 14, 18, 30);
        const normalized = normalizeDate(source);

        expect(normalized).toEqual(new Date(2026, 6, 14));
        expect(normalized).not.toBe(source);
        expect(normalizeDate(null)).toBeNull();
        expect(normalizeDate(new Date('invalid'))).toBeNull();
    });
});
