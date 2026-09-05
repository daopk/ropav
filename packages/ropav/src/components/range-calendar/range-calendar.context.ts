import type { DateRange } from "../../composables/use-calendar";
import type { CalendarDayViewContext, CalendarOwnedProps } from "../calendar/calendar.context";
import type { CalendarDate, DateValue } from "@internationalized/date";
import type { rangeCalendarVariants } from "@ropav/styles";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface RangeCalendarContext {
  /** Slot classes the parts pull their own class from. */
  slots: ComputedRef<ReturnType<typeof rangeCalendarVariants>>;
  /** Present only while the calendar is showing a fixed number of days rather than months. */
  dayView: ComputedRef<CalendarDayViewContext | undefined>;
}

/**
 * Carries the styling and the day-view shape down to the parts.
 *
 * Kept apart from the single calendar's context even though the two hold the same shape, because
 * the classes differ: a range cell is styled by `rp-range-calendar__cell`, and a part that read the
 * wrong context would render with the wrong stylesheet block rather than fail.
 *
 * Strict: a header cell or a grid body outside a range calendar has nothing to describe.
 */
export const [useRangeCalendarContext, provideRangeCalendarContext] =
  createContext<RangeCalendarContext>({ name: "RangeCalendarContext" });

/**
 * What a range calendar will take from something above it instead of from its own markup.
 *
 * The same set as a single calendar's, with the value and its callback widened to a range, plus the
 * one option only a range has.
 */
export interface RangeCalendarOwnedProps extends Omit<
  CalendarOwnedProps,
  "isDateUnavailable" | "onChange" | "value"
> {
  value?: DateRange | null;
  onChange?: (value: DateRange | null) => void;
  /**
   * Rules a date out even though it is inside the range.
   *
   * Takes the anchor as well: whether a date can be reached depends on where the drag started.
   */
  isDateUnavailable?: (date: DateValue, anchorDate: CalendarDate | null) => boolean;
  /** Whether a range may span a date that is unavailable. */
  allowsNonContiguousRanges?: boolean;
}

export interface RangeCalendarOwnerContext {
  props: ComputedRef<RangeCalendarOwnedProps>;
}

/**
 * A range calendar driven by whatever it sits inside.
 *
 * A date range picker holds the range, the bounds and the verdict about them, so the calendar in
 * its popover cannot be told any of that in markup. Mirrors what react-aria-components does with
 * `RangeCalendarContext`.
 *
 * Loose, and absent is the ordinary case: a range calendar on its own owns everything it needs.
 */
export const [useRangeCalendarOwnerContext, provideRangeCalendarOwnerContext] =
  createContext<RangeCalendarOwnerContext | null>({
    defaultValue: null,
    name: "RangeCalendarOwnerContext",
    strict: false,
  });
