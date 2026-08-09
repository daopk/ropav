import type {AnyCalendarState} from "./use-calendar";
import type {DateDuration} from "@internationalized/date";
import type {ComputedRef, MaybeRefOrGetter} from "vue";

import {computed, toValue} from "vue";

import {useDateFormatter} from "./use-date-formatter";

export interface CalendarHeadingFormatOptions {
  day?: "numeric" | "2-digit";
  month?: "numeric" | "2-digit" | "long" | "short" | "narrow";
  year?: "numeric" | "2-digit";
  era?: "long" | "short" | "narrow";
}

export interface UseCalendarHeadingOptions {
  /** How far past the first visible date this heading describes. @default 0 */
  offset?: MaybeRefOrGetter<DateDuration | undefined>;
  /** Overrides the parts the heading is written from. */
  format?: MaybeRefOrGetter<CalendarHeadingFormatOptions | undefined>;
}

/**
 * The heading over one grid of dates: the month and year, or the range a day view covers.
 *
 * Ported from react-aria's `packages/react-aria/src/calendar/useCalendarHeading.ts`
 * (react-aria 3.51.0).
 *
 * The `offset` is what lets a multi-month calendar give each grid its own heading from the one
 * shared state.
 */
export const useCalendarHeading = (
  options: UseCalendarHeadingOptions,
  state: AnyCalendarState,
): ComputedRef<string> => {
  const startDate = computed(() => {
    const offset = toValue(options.offset);
    const start = state.visibleRange.value.start;

    return offset ? start.add(offset) : start;
  });

  /** A day or week view names its two ends; a month or year view names the month. */
  const isDays = computed(() =>
    Boolean(state.visibleDuration.value.days || state.visibleDuration.value.weeks),
  );

  const formatter = useDateFormatter(() => {
    const format = toValue(options.format);

    return {
      calendar: state.visibleRange.value.start.calendar.identifier,
      day: format?.day || (isDays.value ? "numeric" : undefined),
      /*
       * Ported exactly as upstream wrote it, including the precedence: the `||` binds tighter than
       * the `?:`, so *any* requested era resolves to `"short"` rather than to the value asked for.
       * Changing it here would make the heading disagree with React's for the same props.
       */
      era:
        format?.era ||
        (startDate.value.calendar.identifier === "gregory" && startDate.value.era === "BC")
          ? "short"
          : undefined,
      month: format?.month || "long",
      timeZone: state.timeZone.value,
      year: format?.year || "numeric",
    };
  });

  return computed(() => {
    const timeZone = state.timeZone.value;

    if (isDays.value) {
      return formatter.value.formatRange(
        startDate.value.toDate(timeZone),
        state.visibleRange.value.end.toDate(timeZone),
      );
    }

    // A calendar whose months do not line up with the Gregorian ones — a 4-5-4 fiscal year, say —
    // maps its own month back to the one that should be written.
    const displayDate =
      startDate.value.calendar.getFormattableMonth?.(startDate.value) ?? startDate.value;

    return formatter.value.format(displayDate.toDate(timeZone));
  });
};
