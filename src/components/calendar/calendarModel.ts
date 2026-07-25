import {
    addCalendarDays,
    compareDates,
    endOfMonth,
    isSameDate,
    isSameMonth,
    normalizeDate,
    startOfMonth,
    toDateKey,
    toLocalDate,
} from '@/utils/date';
import type {
    CalendarDay,
    CalendarDisabledDates,
    CalendarWeekday,
    CalendarWeekdayFormat,
} from './types';

export interface CreateCalendarDaysOptions {
    month: Date;
    selectedDate: Date | null;
    today: Date;
    firstDayOfWeek: number;
    fixedWeeks: boolean;
    hideOutsideDates: boolean;
    min?: Date;
    max?: Date;
    disabledDates?: CalendarDisabledDates;
}

export function normalizeCalendarDate(value: Date | null | undefined): Date | null {
    return normalizeDate(value);
}

export function normalizeFirstDayOfWeek(value: number | undefined): number {
    if (!Number.isFinite(value)) return 0;
    return ((Math.trunc(value as number) % 7) + 7) % 7;
}

export function isCalendarDateDisabled(
    date: Date,
    options: Pick<CreateCalendarDaysOptions, 'min' | 'max' | 'disabledDates'>,
): boolean {
    const min = normalizeCalendarDate(options.min);
    const max = normalizeCalendarDate(options.max);

    if (min && compareDates(date, min) < 0) return true;
    if (max && compareDates(date, max) > 0) return true;

    if (typeof options.disabledDates === 'function') {
        return options.disabledDates(toLocalDate(date));
    }

    return options.disabledDates?.some((disabledDate) => isSameDate(disabledDate, date)) ?? false;
}

export function createCalendarDays(options: CreateCalendarDaysOptions): CalendarDay[] {
    const month = startOfMonth(options.month);
    const firstDayOfWeek = normalizeFirstDayOfWeek(options.firstDayOfWeek);
    const leadingDays = (month.getDay() - firstDayOfWeek + 7) % 7;
    const gridStart = addCalendarDays(month, -leadingDays);
    const requiredDays = leadingDays + endOfMonth(month).getDate();
    const dayCount = options.fixedWeeks ? 42 : Math.ceil(requiredDays / 7) * 7;

    return Array.from({ length: dayCount }, (_, index) => {
        const date = addCalendarDays(gridStart, index);
        const outside = !isSameMonth(date, month);

        return {
            date,
            key: toDateKey(date),
            label: date.getDate(),
            outside,
            hidden: outside && options.hideOutsideDates,
            selected: isSameDate(date, options.selectedDate),
            today: isSameDate(date, options.today),
            disabled: isCalendarDateDisabled(date, options),
        };
    });
}

export function createCalendarWeeks(days: readonly CalendarDay[]): CalendarDay[][] {
    const weeks: CalendarDay[][] = [];
    for (let index = 0; index < days.length; index += 7) {
        weeks.push(days.slice(index, index + 7));
    }
    return weeks;
}

export function getCalendarWeekdays(
    locale: string | undefined,
    firstDayOfWeek: number,
    format: CalendarWeekdayFormat,
): CalendarWeekday[] {
    const shortFormatter = new Intl.DateTimeFormat(locale, {
        weekday: format,
        timeZone: 'UTC',
    });
    const longFormatter = new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        timeZone: 'UTC',
    });
    const firstDay = normalizeFirstDayOfWeek(firstDayOfWeek);

    return Array.from({ length: 7 }, (_, index) => {
        const weekday = (firstDay + index) % 7;
        const date = new Date(Date.UTC(2021, 7, 1 + weekday));
        return {
            key: weekday,
            label: shortFormatter.format(date),
            ariaLabel: longFormatter.format(date),
        };
    });
}

export function getCalendarMonthLabel(
    month: Date,
    locale?: string,
    format?: Intl.DateTimeFormatOptions,
): string {
    return new Intl.DateTimeFormat(locale, format ?? { month: 'long', year: 'numeric' }).format(
        month,
    );
}

export function getCalendarDayLabel(date: Date, locale?: string): string {
    return new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}
