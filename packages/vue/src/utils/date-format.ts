import type {Calendar, CalendarDateTime, DateValue, ZonedDateTime} from "@internationalized/date";

import {
  Time,
  getLocalTimeZone,
  now,
  toCalendar,
  toCalendarDate,
  toCalendarDateTime,
} from "@internationalized/date";

/**
 * Anything carrying a time of day.
 *
 * Declared here because `@internationalized/date` exports the classes but not this union —
 * upstream it comes from `@react-types/shared`, which is React-only.
 */
export type TimeValue = Time | CalendarDateTime | ZonedDateTime;

/** How precise a date value is, which is also the last segment a field shows. */
export type Granularity = "day" | "hour" | "minute" | "second";

/** The coarsest segment a field shows, which is also where its list of segments starts. */
export type MaxGranularity = "year" | "month" | Granularity;

/** The subset of `Intl.DateTimeFormat` options that name a segment. */
export type FieldOptions = Pick<
  Intl.DateTimeFormatOptions,
  "day" | "hour" | "minute" | "month" | "second" | "year"
>;

export interface FormatterOptions {
  timeZone?: string | undefined;
  hideTimeZone?: boolean | undefined;
  granularity?: Granularity | undefined;
  maxGranularity?: MaxGranularity | undefined;
  hourCycle?: 12 | 24 | undefined;
  showEra?: boolean | undefined;
  shouldForceLeadingZeros?: boolean | undefined;
}

/*
 * Key order is load-bearing in both of these: the two granularity options are resolved to
 * positions in this list, and everything between them becomes a segment. Sorting them
 * alphabetically would silently reorder a date field's segments.
 */
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
const DEFAULT_FIELD_OPTIONS: FieldOptions = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
};

const TWO_DIGIT_FIELD_OPTIONS: FieldOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/**
 * Turn a granularity range into the `Intl.DateTimeFormat` options that produce exactly those
 * segments, ported from react-stately's `packages/react-stately/src/datepicker/utils.ts`
 * (react-stately 3.49.0).
 *
 * This is what decides which segments a date field has at all: the options are the slice of the
 * field list between `maxGranularity` and `granularity`, so a field asking for year-to-day gets
 * three segments and one asking for year-to-minute gets five.
 */
export const getFormatOptions = (
  fieldOptions: FieldOptions,
  options: FormatterOptions,
): Intl.DateTimeFormatOptions => {
  const defaults = options.shouldForceLeadingZeros
    ? TWO_DIGIT_FIELD_OPTIONS
    : DEFAULT_FIELD_OPTIONS;
  const resolved: FieldOptions = {...defaults, ...fieldOptions};
  const granularity = options.granularity ?? "minute";
  const keys = Object.keys(resolved) as (keyof FieldOptions)[];

  let startIdx = keys.indexOf((options.maxGranularity ?? "year") as keyof FieldOptions);

  if (startIdx < 0) startIdx = 0;

  let endIdx = keys.indexOf(granularity);

  // Falls back to the day slot rather than throwing, matching upstream: an unrecognised
  // granularity still has to produce a usable date field.
  if (endIdx < 0) endIdx = 2;

  if (startIdx > endIdx) throw new Error("maxGranularity must be greater than granularity");

  const opts: Intl.DateTimeFormatOptions = {};

  // Cast because each key admits a different set of values in `Intl.DateTimeFormatOptions`
  // (a month may be "long", an hour may not), and the loop is generic over all of them.
  for (const key of keys.slice(startIdx, endIdx + 1)) {
    (opts as Record<string, unknown>)[key] = resolved[key];
  }

  if (options.hourCycle != null) opts.hour12 = options.hourCycle === 12;

  opts.timeZone = options.timeZone || "UTC";

  const hasTime = granularity === "hour" || granularity === "minute" || granularity === "second";

  if (hasTime && options.timeZone && !options.hideTimeZone) opts.timeZoneName = "short";

  // Only when the field starts at the year: an era belongs beside a year, not beside a month.
  if (options.showEra && startIdx === 0) opts.era = "short";

  return opts;
};

/** The time a field falls back to when it has a date but no time to go with it. */
export const getPlaceholderTime = (
  placeholderValue: DateValue | null | undefined,
): TimeValue | Time => {
  if (placeholderValue && "hour" in placeholderValue) return placeholderValue as TimeValue;

  return new Time();
};

/** Re-express a value in another calendar system, preserving the null/undefined distinction. */
export const convertValue = (
  value: DateValue | null | undefined,
  calendar: Calendar,
): DateValue | null | undefined => {
  if (value === null) return null;
  if (!value) return undefined;

  return toCalendar(value, calendar);
};

/**
 * The date an empty field stands on while its segments are still blank.
 *
 * Midnight today, in the right calendar system, trimmed to the shape the granularity needs — a
 * field has to have *some* date to step from before anything has been typed into it.
 */
export const createPlaceholderDate = (
  placeholderValue: DateValue | null | undefined,
  granularity: string,
  calendar: Calendar,
  timeZone: string | undefined,
): DateValue => {
  if (placeholderValue) return convertValue(placeholderValue, calendar)!;

  const date = toCalendar(
    now(timeZone ?? getLocalTimeZone()).set({hour: 0, millisecond: 0, minute: 0, second: 0}),
    calendar,
  );

  if (granularity === "year" || granularity === "month" || granularity === "day") {
    return toCalendarDate(date);
  }

  if (!timeZone) return toCalendarDateTime(date);

  return date;
};
