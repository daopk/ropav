import { describe, expect, it } from 'vitest';
import { createCalendarBehavior } from './calendarBehavior';

type CalendarBehaviorOptions = Parameters<typeof createCalendarBehavior>[0];

function createBehavior(overrides: Partial<CalendarBehaviorOptions> = {}) {
    return createCalendarBehavior({
        month: new Date(2026, 6, 1),
        selectedDate: null,
        today: new Date(2026, 6, 10),
        firstDayOfWeek: 1,
        fixedWeeks: true,
        hideOutsideDates: false,
        locale: 'en-US',
        ...overrides,
    });
}

describe('createCalendarBehavior', () => {
    it('projects a localized six-week view with selection and outside dates', () => {
        const behavior = createBehavior({
            selectedDate: new Date(2026, 6, 14),
        });

        expect(behavior.view.days).toHaveLength(42);
        expect(behavior.view.weeks).toHaveLength(6);
        expect(behavior.view.days[0].key).toBe('2026-06-29');
        expect(behavior.view.days.at(-1)?.key).toBe('2026-08-09');
        expect(behavior.view.days.find((day) => day.selected)?.key).toBe('2026-07-14');
        expect(behavior.view.days.find((day) => day.today)?.key).toBe('2026-07-10');
        expect(behavior.view.days.find((day) => day.key === '2026-07-14')?.ariaLabel).toBe(
            'Tuesday, July 14, 2026',
        );
        expect(behavior.view.monthLabel).toBe('July 2026');
        expect(behavior.view.weekdays.map((weekday) => weekday.label)).toEqual([
            'Mon',
            'Tue',
            'Wed',
            'Thu',
            'Fri',
            'Sat',
            'Sun',
        ]);
    });

    it('projects only required weeks and hides outside dates', () => {
        const behavior = createBehavior({
            month: new Date(2026, 1, 1),
            today: new Date(2026, 0, 1),
            firstDayOfWeek: 0,
            fixedWeeks: false,
            hideOutsideDates: true,
        });

        expect(behavior.view.days).toHaveLength(28);
        expect(behavior.view.days.filter((day) => day.hidden)).toHaveLength(0);
    });

    it('normalizes an out-of-range first day of week', () => {
        expect(
            createBehavior({ firstDayOfWeek: -1 }).view.weekdays.map((weekday) => weekday.label),
        ).toEqual(['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
        expect(createBehavior({ firstDayOfWeek: Number.NaN }).view.weekdays[0].label).toBe('Sun');
    });

    it('skips months entirely before the minimum', () => {
        const behavior = createBehavior({
            month: new Date(2026, 0, 1),
            today: new Date(2026, 0, 1),
            min: new Date(2026, 3, 1),
            max: new Date(2026, 4, 31),
        });

        expect(behavior.view.previousDisabled).toBe(true);
        expect(behavior.view.nextDisabled).toBe(false);
        expect(
            behavior.decide({
                type: 'navigate-month',
                amount: 1,
                focusedDate: new Date(2026, 0, 1),
            }),
        ).toEqual({
            visibleMonth: new Date(2026, 3, 1),
            focusedDate: new Date(2026, 3, 1),
        });
    });

    it('rejects bounded navigation when a predicate excludes every remaining date', () => {
        const behavior = createBehavior({
            month: new Date(2026, 0, 1),
            today: new Date(2026, 0, 1),
            max: new Date(2026, 2, 31),
            disabledDates: (date) => date >= new Date(2026, 1, 1),
        });

        expect(behavior.view.nextDisabled).toBe(true);
        expect(
            behavior.decide({
                type: 'navigate-month',
                amount: 1,
                focusedDate: new Date(2026, 0, 1),
            }),
        ).toBeNull();
    });

    it('keeps unbounded predicate navigation available across an empty month', () => {
        const behavior = createBehavior({
            month: new Date(2026, 0, 1),
            today: new Date(2026, 0, 1),
            disabledDates: (date) => date.getFullYear() === 2026 && date.getMonth() === 1,
        });

        expect(behavior.view.nextDisabled).toBe(false);
        expect(
            behavior.decide({
                type: 'navigate-month',
                amount: 1,
                focusedDate: new Date(2026, 0, 1),
            }),
        ).toEqual({
            visibleMonth: new Date(2026, 1, 1),
            focusedDate: new Date(2026, 1, 1),
        });
    });

    it('prefers the selected date when an external month change needs focus alignment', () => {
        const behavior = createBehavior({
            month: new Date(2026, 7, 1),
            selectedDate: new Date(2026, 7, 20),
        });

        expect(
            behavior.decide({
                type: 'align-month',
                previousMonth: new Date(2026, 6, 1),
                focusedDate: new Date(2026, 6, 15),
            }),
        ).toEqual({ focusedDate: new Date(2026, 7, 20) });
    });

    it('resolves the visible tab stop by focused, selected, today, then first enabled date', () => {
        const selectedBehavior = createBehavior({
            selectedDate: new Date(2026, 6, 14),
        });
        expect(
            selectedBehavior.decide({
                type: 'resolve-focusable',
                focusedDate: new Date(2026, 6, 20),
            }),
        ).toEqual({ focusedDate: new Date(2026, 6, 20) });
        expect(
            selectedBehavior.decide({
                type: 'resolve-focusable',
                focusedDate: new Date(2026, 5, 20),
            }),
        ).toEqual({ focusedDate: new Date(2026, 6, 14) });

        const todayBehavior = createBehavior();
        expect(
            todayBehavior.decide({
                type: 'resolve-focusable',
                focusedDate: new Date(2026, 5, 20),
            }),
        ).toEqual({ focusedDate: new Date(2026, 6, 10) });

        const firstEnabledBehavior = createBehavior({
            today: new Date(2026, 5, 20),
            min: new Date(2026, 6, 5),
        });
        expect(
            firstEnabledBehavior.decide({
                type: 'resolve-focusable',
                focusedDate: new Date(2026, 5, 20),
            }),
        ).toEqual({ focusedDate: new Date(2026, 6, 5) });
    });

    it('has no tab stop when the visible month has no enabled date', () => {
        const behavior = createBehavior({
            disabledDates: (date) => date.getFullYear() === 2026 && date.getMonth() === 6,
        });

        expect(
            behavior.decide({
                type: 'resolve-focusable',
                focusedDate: new Date(2026, 6, 10),
            }),
        ).toBeNull();
    });

    it.each(['Home', 'End'])(
        'does not let %s escape a destination week with no enabled date',
        (key) => {
            const behavior = createBehavior({
                disabledDates: (date) =>
                    date >= new Date(2026, 6, 13) && date <= new Date(2026, 6, 19),
            });

            expect(
                behavior.decide({
                    type: 'move-focus',
                    date: new Date(2026, 6, 15),
                    key,
                }),
            ).toBeNull();
        },
    );

    it('keeps PageDown fallback focus inside the destination month', () => {
        const behavior = createBehavior({
            selectedDate: new Date(2026, 6, 31),
            disabledDates: [new Date(2026, 7, 31)],
        });

        expect(
            behavior.decide({
                type: 'move-focus',
                date: new Date(2026, 6, 31),
                key: 'PageDown',
            }),
        ).toEqual({
            visibleMonth: new Date(2026, 7, 1),
            focusedDate: new Date(2026, 7, 30),
        });
    });
});
