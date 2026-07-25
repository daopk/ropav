import { compareDates, isSameDate, normalizeDate, toLocalDate } from './date';

export type DisabledDateRule = readonly Date[] | ((date: Date) => boolean);

export interface DateAvailabilityOptions {
    min?: Date;
    max?: Date;
    disabledDates?: DisabledDateRule;
}

export function isDateUnavailable(date: Date, options: DateAvailabilityOptions): boolean {
    const min = normalizeDate(options.min);
    const max = normalizeDate(options.max);

    if (min && compareDates(date, min) < 0) return true;
    if (max && compareDates(date, max) > 0) return true;

    if (typeof options.disabledDates === 'function') {
        return options.disabledDates(toLocalDate(date));
    }

    return options.disabledDates?.some((disabledDate) => isSameDate(disabledDate, date)) ?? false;
}
