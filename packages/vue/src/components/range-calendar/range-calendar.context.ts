import type {CalendarDayViewContext} from "../calendar/calendar.context";
import type {rangeCalendarVariants} from "@heroui/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

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
 * the classes differ: a range cell is styled by `range-calendar__cell`, and a part that read the
 * wrong context would render with the wrong stylesheet block rather than fail.
 *
 * Strict: a header cell or a grid body outside a range calendar has nothing to describe.
 */
export const [useRangeCalendarContext, provideRangeCalendarContext] =
  createContext<RangeCalendarContext>({name: "RangeCalendarContext"});
