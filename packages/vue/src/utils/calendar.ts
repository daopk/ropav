import type {CalendarDate, DateDuration, DateValue} from "@internationalized/date";

import {
  isSameDay,
  maxDate,
  minDate,
  startOfMonth,
  startOfWeek,
  startOfYear,
  toCalendarDate,
} from "@internationalized/date";

/** The day a week can be told to start on, spelled the way `@internationalized/date` spells it. */
export type DayOfWeek = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

/** How wide a weekday name is written. */
export type WeekdayStyle = "narrow" | "short" | "long";

/*
 * Range alignment, ported from react-stately's `packages/react-stately/src/calendar/utils.ts`
 * (react-stately 3.49.0). Pure date arithmetic, so it ports across unchanged.
 */

/** Whether a date falls outside the allowed range. */
export const isDateInvalid = (
  date: DateValue,
  minValue?: DateValue | null,
  maxValue?: DateValue | null,
): boolean =>
  (minValue != null && date.compare(minValue) < 0) ||
  (maxValue != null && date.compare(maxValue) > 0);

/**
 * Pull an aligned range back inside `minValue`/`maxValue`.
 *
 * Only clamps on the side the date itself is already inside: a focused date beyond the maximum has
 * to keep its own page visible, or the calendar would jump somewhere the user did not ask for.
 */
export const constrainStart = (
  date: CalendarDate,
  aligned: CalendarDate,
  duration: DateDuration,
  locale: string,
  minValue?: DateValue | null,
  maxValue?: DateValue | null,
): CalendarDate => {
  let result = aligned;

  if (minValue && date.compare(minValue) >= 0) {
    const next = maxDate(result, alignStart(toCalendarDate(minValue), duration, locale));

    if (next) result = next;
  }

  if (maxValue && date.compare(maxValue) <= 0) {
    const next = minDate(result, alignEnd(toCalendarDate(maxValue), duration, locale));

    if (next) result = next;
  }

  return result;
};

/** Align a visible range so `date` sits in its first unit. */
export const alignStart = (
  date: CalendarDate,
  duration: DateDuration,
  locale: string,
  minValue?: DateValue | null,
  maxValue?: DateValue | null,
): CalendarDate => {
  // Align to the start of the largest unit the range spans.
  let aligned = date;

  if (duration.years) {
    aligned = startOfYear(date);
  } else if (duration.months) {
    aligned = startOfMonth(date);
  } else if (duration.weeks || (duration.days && duration.days > 7)) {
    aligned = startOfWeek(date, locale);
  }

  return constrainStart(date, aligned, duration, locale, minValue, maxValue);
};

/** Align a visible range so `date` sits in its last unit. */
export const alignEnd = (
  date: CalendarDate,
  duration: DateDuration,
  locale: string,
  minValue?: DateValue | null,
  maxValue?: DateValue | null,
): CalendarDate => {
  const rest: DateDuration = {...duration};

  // Subtract one from the smallest unit, so the range ends on the unit holding `date`.
  if (rest.days) {
    rest.days--;
  } else if (rest.weeks) {
    rest.weeks--;
  } else if (rest.months) {
    rest.months--;
  } else if (rest.years) {
    rest.years--;
  }

  const aligned = alignStart(date, duration, locale).subtract(rest);

  return constrainStart(date, aligned, duration, locale, minValue, maxValue);
};

/** Align a visible range so `date` sits in the middle of it. */
export const alignCenter = (
  date: CalendarDate,
  duration: DateDuration,
  locale: string,
  minValue?: DateValue | null,
  maxValue?: DateValue | null,
): CalendarDate => {
  const half: Record<string, number> = {};

  for (const key of Object.keys(duration) as (keyof DateDuration)[]) {
    const value = duration[key] ?? 0;

    half[key] = Math.floor(value / 2);

    // An even span has no true middle unit, so bias towards the earlier of the two: three visible
    // months put the focused one second, four put it second as well rather than third.
    if (half[key] > 0 && value % 2 === 0) half[key]--;
  }

  const aligned = alignStart(date, duration, locale).subtract(half as DateDuration);

  return constrainStart(date, aligned, duration, locale, minValue, maxValue);
};

/** Clamp a date into the allowed range. */
export const constrainValue = (
  date: CalendarDate,
  minValue?: DateValue | null,
  maxValue?: DateValue | null,
): CalendarDate => {
  let result = date;

  if (minValue) {
    const next = maxDate(result, toCalendarDate(minValue));

    if (next) result = next;
  }

  if (maxValue) {
    const next = minDate(result, toCalendarDate(maxValue));

    if (next) result = next;
  }

  return result;
};

/**
 * Walk back from `date` to the nearest available day, stopping at `minValue`.
 *
 * Returns `null` when the whole stretch down to `minValue` is unavailable, which is what tells the
 * caller there is nothing to select rather than to select the boundary.
 */
export const previousAvailableDate = (
  date: CalendarDate,
  minValue: DateValue,
  isDateUnavailable?: (date: CalendarDate) => boolean,
): CalendarDate | null => {
  if (!isDateUnavailable) return date;

  let result = date;

  while (result.compare(minValue) >= 0 && isDateUnavailable(result)) {
    result = result.subtract({days: 1});
  }

  return result.compare(minValue) >= 0 ? result : null;
};

/** Whether two visible durations span the same thing. */
export const isEqualDuration = (a: DateDuration, b: DateDuration): boolean =>
  a === b ||
  (a.days === b.days && a.weeks === b.weeks && a.months === b.months && a.years === b.years);

/*
 * Year bounds and day-view grids, ported from HeroUI React's `packages/react/src/utils/calendar.ts`.
 */

/**
 * How far a calendar system's year numbering sits from the Gregorian one.
 *
 * Used to turn the default 1900–2099 Gregorian bounds into the same span of real time in whatever
 * calendar the locale resolves to, so the year picker offers years the user recognises.
 */
export const getGregorianYearOffset = (identifier: string): number => {
  switch (identifier) {
    case "buddhist":
      return 543;
    case "ethiopic":
    case "ethioaa":
      return -8;
    case "coptic":
      return -284;
    case "hebrew":
      return 3760;
    case "indian":
      return -78;
    case "islamic-civil":
    case "islamic-tbla":
    case "islamic-umalqura":
      return -579;
    case "persian":
      return -600;
    case "roc":
    case "japanese":
    case "gregory":
    default:
      return 0;
  }
};

/**
 * Every year start from `start` to `end` inclusive.
 *
 * Steps with calendar-aware arithmetic rather than counting integers, because a year is not a fixed
 * number of anything in the Hebrew or Japanese calendars.
 */
export const getYearRange = (start?: DateValue | null, end?: DateValue | null): DateValue[] => {
  const years: DateValue[] = [];

  if (!start || !end) return years;

  let current = startOfYear(start);

  while (current.compare(end) <= 0) {
    years.push(current);
    current = startOfYear(current.add({years: 1}));
  }

  return years;
};

/** The weekday names above a day view, starting from the week `start` falls in. */
export const getDayViewWeekDayLabels = (
  start: DateValue,
  locale: string,
  firstDayOfWeek: DayOfWeek | undefined,
  weekdayStyle: WeekdayStyle = "short",
  timeZone = "UTC",
): string[] => {
  const formatter = new Intl.DateTimeFormat(locale, {timeZone, weekday: weekdayStyle});
  const labels: string[] = [];
  let date = startOfWeek(start, locale, firstDayOfWeek);

  for (let index = 0; index < 7; index++) {
    labels.push(formatter.format(date.toDate(timeZone)));
    const next = date.add({days: 1});

    // The calendar system has no day after this one, so the week is short.
    if (isSameDay(date, next)) break;

    date = next;
  }

  while (labels.length < 7) labels.push("");

  return labels;
};

const buildDayViewWeekRow = (rowStart: DateValue, end: DateValue): (DateValue | null)[] => {
  const row: (DateValue | null)[] = [];
  let date = rowStart;

  for (let index = 0; index < 7; index++) {
    row.push(date.compare(end) > 0 ? null : date);

    const next = date.add({days: 1});

    if (isSameDay(date, next)) {
      while (row.length < 7) row.push(null);

      return row;
    }

    date = next;
  }

  return row;
};

/**
 * Week-aligned rows for a day view.
 *
 * The first row starts on its week boundary rather than on `start`, so a day view lines up under
 * the weekday names; the leading dates are rendered but fall outside the visible range.
 */
export const getDayViewGridRows = (
  start: DateValue,
  end: DateValue,
  locale: string,
  firstDayOfWeek?: DayOfWeek,
): (DateValue | null)[][] => {
  const rows: (DateValue | null)[][] = [];
  let rowStart = startOfWeek(start, locale, firstDayOfWeek);

  rows.push(buildDayViewWeekRow(rowStart, end));

  rowStart = rowStart.add({weeks: 1});

  while (rowStart.compare(end) <= 0) {
    rows.push(buildDayViewWeekRow(rowStart, end));
    const nextWeek = rowStart.add({weeks: 1});

    if (isSameDay(rowStart, nextWeek)) break;

    rowStart = nextWeek;
  }

  return rows;
};
