import { describe, expect, it, vi } from 'vitest';
import { isDateUnavailable } from './dateAvailability';

describe('isDateUnavailable', () => {
    it.each([
        ['before the minimum', new Date(2026, 6, 4), true],
        ['at the minimum', new Date(2026, 6, 5), false],
        ['inside the range', new Date(2026, 6, 10), false],
        ['at the maximum', new Date(2026, 6, 20), false],
        ['after the maximum', new Date(2026, 6, 21), true],
    ])('%s', (_case, date, expected) => {
        expect(
            isDateUnavailable(date, {
                min: new Date(2026, 6, 5, 18),
                max: new Date(2026, 6, 20, 18),
            }),
        ).toBe(expected);
    });

    it('matches explicit disabled dates by civil date', () => {
        expect(
            isDateUnavailable(new Date(2026, 6, 10, 8), {
                disabledDates: [new Date(2026, 6, 10, 18)],
            }),
        ).toBe(true);
    });

    it('passes a normalized local date to a disabled predicate', () => {
        const predicate = vi.fn(() => true);

        expect(
            isDateUnavailable(new Date(2026, 6, 12, 18, 30), {
                disabledDates: predicate,
            }),
        ).toBe(true);
        expect(predicate).toHaveBeenCalledWith(new Date(2026, 6, 12));
    });
});
