import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { flush, keydown, mountDomWithApp } from '../../../tests/utils/vue';
import { isSameDate, toDateKey } from '@/utils/date';
import type { CalendarProps } from './types';
import { useCalendar } from './useCalendar';

function mountCalendar(overrides: CalendarProps = {}) {
    const props: CalendarProps = { ...overrides };
    const value = vi.fn<(date: Date) => void>();
    const month = vi.fn<(date: Date) => void>();
    const change = vi.fn<(date: Date) => void>();
    let calendar!: ReturnType<typeof useCalendar>;

    const mounted = mountDomWithApp(
        defineComponent({
            setup() {
                calendar = useCalendar(props, { value, month, change });

                return () =>
                    h(
                        'div',
                        { ref: calendar.rootRef },
                        calendar.weeks.value.map((week, weekIndex) =>
                            h(
                                'div',
                                {
                                    key: `${toDateKey(calendar.visibleMonth.value)}-${weekIndex}`,
                                },
                                week
                                    .filter((day) => !day.hidden)
                                    .map((day) =>
                                        h(
                                            'button',
                                            {
                                                key: day.key,
                                                type: 'button',
                                                'data-date': day.key,
                                                disabled: day.disabled,
                                                tabindex: isSameDate(
                                                    day.date,
                                                    calendar.focusableDate.value,
                                                )
                                                    ? 0
                                                    : -1,
                                                onFocus: () => calendar.onDayFocus(day),
                                                onKeydown: (event: KeyboardEvent) =>
                                                    calendar.onDayKeydown(event, day),
                                            },
                                            day.label,
                                        ),
                                    ),
                            ),
                        ),
                    );
            },
        }),
    );

    return { ...mounted, props, calendar, value, month, change };
}

afterEach(() => {
    vi.useRealTimers();
});

describe('useCalendar', () => {
    it('navigates across adjacent months that fall entirely before the minimum', async () => {
        const { calendar, month } = mountCalendar({
            defaultMonth: new Date(2026, 0, 1),
            min: new Date(2026, 3, 1),
            max: new Date(2026, 4, 31),
        });

        expect(calendar.previousDisabled.value).toBe(true);
        expect(calendar.nextDisabled.value).toBe(false);

        calendar.navigateMonth(1);
        await flush();

        expect(calendar.visibleMonth.value).toEqual(new Date(2026, 3, 1));
        expect(calendar.focusableDate.value).toEqual(new Date(2026, 3, 1));
        expect(month).toHaveBeenCalledWith(new Date(2026, 3, 1));
    });

    it('disables bounded navigation when a predicate excludes every remaining date', () => {
        const { calendar, month } = mountCalendar({
            defaultMonth: new Date(2026, 0, 1),
            max: new Date(2026, 2, 31),
            disabledDates: (date) => date >= new Date(2026, 1, 1),
        });

        expect(calendar.nextDisabled.value).toBe(true);

        calendar.navigateMonth(1);

        expect(calendar.visibleMonth.value).toEqual(new Date(2026, 0, 1));
        expect(month).not.toHaveBeenCalled();
    });

    it('keeps unbounded predicate navigation available across an empty month', async () => {
        const { calendar } = mountCalendar({
            defaultMonth: new Date(2026, 0, 1),
            disabledDates: (date) => date.getFullYear() === 2026 && date.getMonth() === 1,
        });

        expect(calendar.nextDisabled.value).toBe(false);

        calendar.navigateMonth(1);
        await flush();
        expect(calendar.visibleMonth.value).toEqual(new Date(2026, 1, 1));
        expect(calendar.focusableDate.value).toBeNull();
        expect(calendar.nextDisabled.value).toBe(false);

        calendar.navigateMonth(1);
        await flush();
        expect(calendar.visibleMonth.value).toEqual(new Date(2026, 2, 1));
        expect(calendar.focusableDate.value).toEqual(new Date(2026, 2, 1));
    });

    it('starts on today and keeps the header-navigation tab stop in the visible month', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 6, 15, 12));
        const { calendar } = mountCalendar({ defaultMonth: new Date(2026, 6, 1) });

        expect(calendar.focusableDate.value).toEqual(new Date(2026, 6, 15));

        calendar.navigateMonth(1);
        await flush();

        expect(calendar.visibleMonth.value).toEqual(new Date(2026, 7, 1));
        expect(calendar.focusableDate.value).toEqual(new Date(2026, 7, 15));
    });

    it('restores day focus after selecting an outside date changes the rendered month', async () => {
        const { calendar, container } = mountCalendar({
            defaultMonth: new Date(2026, 6, 1),
        });
        await flush();

        const outsideDay = container.querySelector('[data-date="2026-08-01"]') as HTMLButtonElement;
        outsideDay.focus();
        keydown(outsideDay, 'Enter');
        await flush();

        expect(calendar.visibleMonth.value).toEqual(new Date(2026, 7, 1));
        expect(document.activeElement).toBe(container.querySelector('[data-date="2026-08-01"]'));
    });

    it('keeps Home and End searches inside their destination week', () => {
        const { calendar } = mountCalendar({
            defaultMonth: new Date(2026, 6, 1),
            firstDayOfWeek: 1,
            disabledDates: (date) => date >= new Date(2026, 6, 13) && date <= new Date(2026, 6, 19),
        });
        const day = calendar.days.value.find((candidate) =>
            isSameDate(candidate.date, new Date(2026, 6, 15)),
        )!;

        for (const key of ['Home', 'End']) {
            const event = new KeyboardEvent('keydown', { key, cancelable: true });
            calendar.onDayKeydown(event, day);
            expect(event.defaultPrevented).toBe(false);
        }
    });

    it('keeps PageDown fallback focus inside the destination month', async () => {
        const { calendar, container } = mountCalendar({
            defaultValue: new Date(2026, 6, 31),
            disabledDates: [new Date(2026, 7, 31)],
        });
        await flush();

        const july = container.querySelector('[data-date="2026-07-31"]') as HTMLButtonElement;
        july.focus();
        keydown(july, 'PageDown');
        await flush();

        expect(calendar.visibleMonth.value).toEqual(new Date(2026, 7, 1));
        expect(document.activeElement).toBe(container.querySelector('[data-date="2026-08-30"]'));
    });

    it('refreshes the today marker after local midnight', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 6, 31, 23, 59, 59, 900));
        const { calendar } = mountCalendar({ defaultMonth: new Date(2026, 6, 1) });

        expect(calendar.days.value.find((day) => day.today)?.key).toBe('2026-07-31');

        vi.advanceTimersByTime(100);
        await flush();

        expect(calendar.days.value.find((day) => day.today)?.key).toBe('2026-08-01');
    });
});
