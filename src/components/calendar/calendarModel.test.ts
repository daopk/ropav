import { describe, expect, it } from 'vitest';
import {
    createCalendarDays,
    createCalendarWeeks,
    getCalendarWeekdays,
    isCalendarDateDisabled,
    normalizeFirstDayOfWeek,
} from './calendarModel';

describe('calendarModel', () => {
    it('creates a stable six-week grid with selection and outside dates', () => {
        const days = createCalendarDays({
            month: new Date(2026, 6, 1),
            selectedDate: new Date(2026, 6, 14),
            today: new Date(2026, 6, 10),
            firstDayOfWeek: 1,
            fixedWeeks: true,
            hideOutsideDates: false,
        });

        expect(days).toHaveLength(42);
        expect(days[0].key).toBe('2026-06-29');
        expect(days.at(-1)?.key).toBe('2026-08-09');
        expect(days.find((day) => day.selected)?.key).toBe('2026-07-14');
        expect(days.find((day) => day.today)?.key).toBe('2026-07-10');
        expect(createCalendarWeeks(days)).toHaveLength(6);
    });

    it('can use only the required weeks and hide outside dates', () => {
        const days = createCalendarDays({
            month: new Date(2026, 1, 1),
            selectedDate: null,
            today: new Date(2026, 0, 1),
            firstDayOfWeek: 0,
            fixedWeeks: false,
            hideOutsideDates: true,
        });

        expect(days).toHaveLength(28);
        expect(days.filter((day) => day.hidden)).toHaveLength(0);
    });

    it('applies range, list, and predicate disabled rules', () => {
        const base = {
            min: new Date(2026, 6, 5),
            max: new Date(2026, 6, 20),
        };

        expect(isCalendarDateDisabled(new Date(2026, 6, 4), base)).toBe(true);
        expect(isCalendarDateDisabled(new Date(2026, 6, 10), base)).toBe(false);
        expect(
            isCalendarDateDisabled(new Date(2026, 6, 10), {
                ...base,
                disabledDates: [new Date(2026, 6, 10)],
            }),
        ).toBe(true);
        expect(
            isCalendarDateDisabled(new Date(2026, 6, 12), {
                disabledDates: (date) => date.getDay() === 0,
            }),
        ).toBe(true);
    });

    it('normalizes week starts and creates localized weekday labels', () => {
        expect(normalizeFirstDayOfWeek(-1)).toBe(6);
        expect(normalizeFirstDayOfWeek(8)).toBe(1);
        expect(normalizeFirstDayOfWeek(Number.NaN)).toBe(0);

        const weekdays = getCalendarWeekdays('en-US', 1, 'short');
        expect(weekdays.map((weekday) => weekday.label)).toEqual([
            'Mon',
            'Tue',
            'Wed',
            'Thu',
            'Fri',
            'Sat',
            'Sun',
        ]);
    });
});
