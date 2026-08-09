import type {Calendar, DateValue, ZonedDateTime} from "@internationalized/date";

import {CalendarDate} from "@internationalized/date";

/** How the hours of a day are numbered in a locale. */
export type HourCycle = "h11" | "h12" | "h23" | "h24";

/** Every kind of part a formatted date can be cut into, editable or not. */
export type DateSegmentType =
  | "day"
  | "dayPeriod"
  | "era"
  | "hour"
  | "literal"
  | "minute"
  | "month"
  | "second"
  | "timeZoneName"
  | "year";

/** The fields an incomplete date actually stores, which is a subset of the segment types. */
type StoredField =
  | "day"
  | "dayPeriod"
  | "era"
  | "hour"
  | "millisecond"
  | "minute"
  | "month"
  | "offset"
  | "second"
  | "year";

/**
 * Anything an incomplete date can be seeded from.
 *
 * Every member is optional rather than intersecting the `@internationalized/date` shapes: a
 * `CalendarDate` has no hour and a `CalendarDateTime` has no offset, so an intersection would
 * reject both of the types this is actually called with.
 */
export interface PartialDateFields {
  era?: string;
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  millisecond?: number;
  offset?: number;
}

export interface SegmentLimits {
  value: number | null;
  minValue: number;
  maxValue: number;
}

/**
 * Move a segment's value by an amount, wrapping around at both ends.
 *
 * `round` snaps to a multiple of the step, so paging a minute field by 15 lands on :00/:15/:30/:45
 * rather than 15 minutes further along from wherever it was.
 */
const cycleValue = (
  value: number,
  amount: number,
  min: number,
  max: number,
  round = false,
): number => {
  let next = value;

  if (round) {
    next += Math.sign(amount);

    if (next < min) next = max;

    const div = Math.abs(amount);

    next = amount > 0 ? Math.ceil(next / div) * div : Math.floor(next / div) * div;

    if (next > max) next = min;
  } else {
    next += amount;

    if (next < min) next = max - (min - next - 1);
    else if (next > max) next = min + (next - max - 1);
  }

  return next;
};

/** Split a 24-hour hour into the day period and hour a locale's clock would show. */
export const toHourCycle = (hour: number, hourCycle: HourCycle): [number | null, number] => {
  let dayPeriod: number | null = hour >= 12 ? 1 : 0;
  let next = hour;

  switch (hourCycle) {
    case "h11":
      // Numbered 0 to 11, used in Japan.
      if (next >= 12) next -= 12;
      break;
    case "h12":
      // Numbered 12 (standing for 0) to 11.
      if (next === 0) next = 12;
      else if (next > 12) next -= 12;
      break;
    case "h23":
      dayPeriod = null;
      break;
    case "h24":
      // Numbered 1 to 24. Unused in practice but `Intl.DateTimeFormat` supports it.
      next += 1;
      dayPeriod = null;
  }

  return [dayPeriod, next];
};

/** Put a clock hour and day period back together into a 24-hour hour. */
export const fromHourCycle = (hour: number, dayPeriod: number, hourCycle: HourCycle): number => {
  let next = hour;

  switch (hourCycle) {
    case "h11":
      if (dayPeriod === 1) next += 12;
      break;
    case "h12":
      if (next === 12) next = 0;
      if (dayPeriod === 1) next += 12;
      break;
    case "h24":
      next -= 1;
  }

  return next;
};

/**
 * A date being typed, where any segment may still be blank.
 *
 * Ported from react-stately's `packages/react-stately/src/datepicker/IncompleteDate.ts`
 * (react-stately 3.49.0), essentially unchanged — it is a plain class with no framework in it.
 *
 * This exists because a real `CalendarDate` cannot represent what a half-filled field holds. Typing
 * "February 30" has to stay on screen while the day segment is still being edited, and a field with
 * only a year in it has no month or day at all yet. Every segment is therefore nullable, and the
 * value is only turned into a real date once it is complete and valid.
 */
export class IncompleteDate {
  calendar: Calendar;
  era: string | null;
  year: number | null;
  month: number | null;
  day: number | null;
  hour: number | null;
  hourCycle: HourCycle;
  dayPeriod: number | null;
  minute: number | null;
  second: number | null;
  millisecond: number | null;
  offset: number | null;

  constructor(calendar: Calendar, hourCycle: HourCycle, dateValue?: PartialDateFields | null) {
    this.calendar = calendar;
    this.hourCycle = hourCycle;
    this.era = dateValue?.era ?? null;
    this.year = dateValue?.year ?? null;
    this.month = dateValue?.month ?? null;
    this.day = dateValue?.day ?? null;
    this.hour = dateValue?.hour ?? null;
    this.dayPeriod = null;
    this.minute = dateValue?.minute ?? null;
    this.second = dateValue?.second ?? null;
    this.millisecond = dateValue?.millisecond ?? null;
    this.offset = dateValue != null && "offset" in dateValue ? (dateValue.offset ?? null) : null;

    // The value arrives on a 24-hour clock; the field shows whatever clock the locale uses.
    if (this.hour != null) {
      const [dayPeriod, hour] = toHourCycle(this.hour, hourCycle);

      this.dayPeriod = dayPeriod;
      this.hour = hour;
    }
  }

  /** Read a segment, answering `undefined` for the ones no value is stored for. */
  private read(field: DateSegmentType): number | string | null | undefined {
    if (field === "literal" || field === "timeZoneName") return undefined;

    return this[field as StoredField];
  }

  copy(): IncompleteDate {
    const result = new IncompleteDate(this.calendar, this.hourCycle);

    result.era = this.era;
    result.year = this.year;
    result.month = this.month;
    result.day = this.day;
    result.hour = this.hour;
    result.dayPeriod = this.dayPeriod;
    result.minute = this.minute;
    result.second = this.second;
    result.millisecond = this.millisecond;
    result.offset = this.offset;

    return result;
  }

  /** Whether every one of the given segments has been filled in. */
  isComplete(segments: DateSegmentType[]): boolean {
    return segments.every((segment) => this.read(segment) != null);
  }

  /** Whether a real date agrees with what is on screen, segment by segment. */
  validate(date: DateValue, segments: DateSegmentType[]): boolean {
    return segments.every((segment) => {
      if ((segment === "hour" || segment === "dayPeriod") && "hour" in date) {
        const [dayPeriod, hour] = toHourCycle(date.hour, this.hourCycle);

        return this.dayPeriod === dayPeriod && this.hour === hour;
      }

      return this.read(segment) === (date as unknown as Record<string, unknown>)[segment];
    });
  }

  /** Whether every one of the given segments is still blank. */
  isCleared(segments: DateSegmentType[]): boolean {
    return segments.every((segment) => this.read(segment) === null);
  }

  /** Set one segment, filling in whatever else that implies. */
  set(field: DateSegmentType, value: number | string, placeholder: DateValue): IncompleteDate {
    const result = this.copy();

    (result as unknown as Record<string, unknown>)[field] = value;

    // Typing an hour with no period yet has to pick one, or the value would be ambiguous.
    if (field === "hour" && result.dayPeriod == null && "hour" in placeholder) {
      result.dayPeriod = toHourCycle(placeholder.hour, this.hourCycle)[0];
    }

    if (field === "year" && result.era == null) result.era = placeholder.era;

    // The offset belongs to a particular instant, so any change to the date or time invalidates it.
    if (field !== "second" && field !== "literal" && field !== "timeZoneName") result.offset = null;

    return result;
  }

  /** Blank one segment out. */
  clear(field: DateSegmentType): IncompleteDate {
    const result = this.copy();

    (result as unknown as Record<string, unknown>)[field] = null;

    // A year with no era is meaningless, so the era goes with it.
    if (field === "year") result.era = null;

    result.offset = null;

    return result;
  }

  /**
   * Step one segment by an amount, filling it from the placeholder if it is still blank.
   *
   * A blank segment takes the placeholder's value rather than stepping from it, so the first arrow
   * press on an empty field lands on today rather than on the day after today.
   */
  cycle(
    field: DateSegmentType,
    amount: number,
    placeholder: DateValue,
    displaySegments: DateSegmentType[],
  ): IncompleteDate {
    const result = this.copy();

    if (this.read(field) == null && field !== "dayPeriod" && field !== "era") {
      if (field === "hour" && "hour" in placeholder) {
        const [dayPeriod, hour] = toHourCycle(placeholder.hour, this.hourCycle);

        result.dayPeriod = dayPeriod;
        result.hour = hour;
      } else {
        (result as unknown as Record<string, unknown>)[field] = (
          placeholder as unknown as Record<string, unknown>
        )[field];
      }

      if (field === "year" && result.era == null) result.era = placeholder.era;

      return result;
    }

    switch (field) {
      case "era": {
        const eras = this.calendar.getEras();
        const index = cycleValue(eras.indexOf(result.era!), amount, 0, eras.length - 1);

        result.era = eras[index]!;
        break;
      }
      case "year": {
        // Stepped through `CalendarDate` so that crossing between 1 AD and 1 BC moves the era too.
        let date = new CalendarDate(
          this.calendar,
          this.era ?? placeholder.era,
          this.year ?? placeholder.year,
          this.month ?? 1,
          this.day ?? 1,
        );

        date = date.cycle(field, amount, {round: true});
        result.era = date.era;
        result.year = date.year;
        break;
      }
      case "month":
        result.month = cycleValue(
          result.month ?? 1,
          amount,
          1,
          this.calendar.getMaximumMonthsInYear(),
        );
        break;
      case "day":
        // The maximum across any month, so February can be stepped up to 30 while it is being
        // typed — the value is constrained later, on blur.
        result.day = cycleValue(result.day ?? 1, amount, 1, this.calendar.getMaximumDaysInMonth());
        break;
      case "hour": {
        const hasDateSegments = displaySegments.some((segment) =>
          ["day", "month", "year"].includes(segment),
        );

        // Stepped through a real `ZonedDateTime` when there is one to be had, so that an hour
        // crossing a daylight-saving boundary lands where the clock actually lands.
        if (
          "timeZone" in placeholder &&
          (!hasDateSegments || (result.year != null && result.month != null && result.day != null))
        ) {
          const date = (this.toValue(placeholder) as ZonedDateTime).cycle("hour", amount, {
            hourCycle: this.hourCycle === "h12" ? 12 : 24,
            round: false,
          });
          const [dayPeriod, adjustedHour] = toHourCycle(date.hour, this.hourCycle);

          result.hour = adjustedHour;
          result.dayPeriod = dayPeriod;
          result.offset = date.offset;
        } else {
          const limits = this.getSegmentLimits("hour")!;

          result.hour = cycleValue(result.hour ?? 0, amount, limits.minValue, limits.maxValue);

          if (result.dayPeriod == null && "hour" in placeholder) {
            result.dayPeriod = toHourCycle(placeholder.hour, this.hourCycle)[0];
          }
        }
        break;
      }
      case "dayPeriod":
        result.dayPeriod = cycleValue(result.dayPeriod ?? 0, amount, 0, 1);
        break;
      case "minute":
        result.minute = cycleValue(result.minute ?? 0, amount, 0, 59, true);
        break;
      case "second":
        result.second = cycleValue(result.second ?? 0, amount, 0, 59, true);
        break;
    }

    return result;
  }

  /** Fill every blank segment from the given value, producing a real date. */
  toValue(value: DateValue): DateValue {
    if ("hour" in value) {
      let hour = this.hour;

      if (hour != null) {
        hour = fromHourCycle(hour, this.dayPeriod ?? 0, this.hourCycle);
      } else if (this.hourCycle === "h12" || this.hourCycle === "h11") {
        // No hour typed yet, but a period already chosen — midnight or noon, accordingly.
        hour = this.dayPeriod === 1 ? 12 : 0;
      }

      let result = value.set({
        day: this.day ?? value.day,
        era: this.era ?? value.era,
        hour: hour ?? value.hour,
        millisecond: this.millisecond ?? value.millisecond,
        minute: this.minute ?? value.minute,
        month: this.month ?? value.month,
        second: this.second ?? value.second,
        year: this.year ?? value.year,
      });

      // A stored offset that no longer matches means the wall time was reached from the other side
      // of a daylight-saving change, so the instant has to be shifted to keep it.
      if ("offset" in result && this.offset != null && result.offset !== this.offset) {
        result = result.add({milliseconds: result.offset - this.offset});
      }

      return result;
    }

    return value.set({
      day: this.day ?? value.day,
      era: this.era ?? value.era,
      month: this.month ?? value.month,
      year: this.year ?? value.year,
    });
  }

  /** The current value of a segment and how far it may be stepped in either direction. */
  getSegmentLimits(type: string): SegmentLimits | undefined {
    switch (type) {
      case "era": {
        const eras = this.calendar.getEras();

        return {
          maxValue: eras.length - 1,
          minValue: 0,
          value: this.era != null ? eras.indexOf(this.era) : eras.length - 1,
        };
      }
      case "year":
        return {maxValue: 9999, minValue: 1, value: this.year};
      case "month":
        return {maxValue: this.calendar.getMaximumMonthsInYear(), minValue: 1, value: this.month};
      case "day":
        return {maxValue: this.calendar.getMaximumDaysInMonth(), minValue: 1, value: this.day};
      case "dayPeriod":
        return {maxValue: 1, minValue: 0, value: this.dayPeriod};
      case "hour": {
        if (this.hourCycle === "h12") return {maxValue: 12, minValue: 1, value: this.hour};
        if (this.hourCycle === "h11") return {maxValue: 11, minValue: 0, value: this.hour};

        return {maxValue: 23, minValue: 0, value: this.hour};
      }
      case "minute":
        return {maxValue: 59, minValue: 0, value: this.minute};
      case "second":
        return {maxValue: 59, minValue: 0, value: this.second};
    }

    return undefined;
  }
}
