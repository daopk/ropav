import type {AnyCalendarState, UseCalendarReturn} from "../../composables/use-calendar";
import type {CalendarValue, PageBehavior} from "../../composables/use-calendar-state";
import type {DayOfWeek, WeekdayStyle} from "../../utils/calendar";
import type {CalendarDate, DateValue} from "@internationalized/date";
import type {calendarVariants} from "@ropav/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

/** What a day view needs that a month grid does not: how many days, and which ones. */
export interface CalendarDayViewContext {
  days: number;
  firstDayOfWeek?: DayOfWeek;
  timeZone: string;
  visibleRange: {start: CalendarDate; end: CalendarDate};
  weekdayStyle?: WeekdayStyle;
}

export interface CalendarContext {
  /** Slot classes the parts pull their own class from. */
  slots: ComputedRef<ReturnType<typeof calendarVariants>>;
  /** Present only while the calendar is showing a fixed number of days rather than months. */
  dayView: ComputedRef<CalendarDayViewContext | undefined>;
}

/**
 * Carries the styling and the day-view shape down to the parts.
 *
 * Strict: a header cell or a grid body outside a calendar has nothing to describe.
 */
export const [useCalendarContext, provideCalendarContext] = createContext<CalendarContext>({
  name: "CalendarContext",
});

export interface CalendarStateContext {
  state: AnyCalendarState;
  calendar: UseCalendarReturn;
}

/**
 * The live calendar, published by whichever root is above.
 *
 * One context for both kinds of calendar rather than one each, which is what lets the grid, the
 * cells and the year picker be written once and used under either root. react-aria keeps two
 * separate contexts and every consumer reads both, taking whichever is not null.
 */
export const [useCalendarStateContext, provideCalendarStateContext] =
  createContext<CalendarStateContext>({name: "CalendarStateContext"});

export interface CalendarGridContext {
  /** Spread onto the grid's header row container. */
  headerAttrs: ComputedRef<Record<string, unknown>>;
  weekDays: ComputedRef<string[]>;
  /** The first date this grid shows, which is not the calendar's own start in a multi-month view. */
  startDate: ComputedRef<CalendarDate>;
  weeksInMonth: ComputedRef<number>;
}

/**
 * One grid's own shape, for the header and body inside it.
 *
 * Separate from the calendar context because a multi-month calendar has several grids over one
 * state, and each row of cells has to know which month it belongs to.
 */
export const [useCalendarGridContext, provideCalendarGridContext] =
  createContext<CalendarGridContext>({
    errorMessage: "Calendar grid parts must be used inside <Calendar.Grid>.",
    name: "CalendarGridContext",
  });

/**
 * What a calendar will take from something above it instead of from its own markup.
 *
 * Everything is optional and a prop written on the calendar itself always wins, so a calendar
 * standing on its own behaves exactly as before.
 */
export interface CalendarOwnedProps {
  ariaLabel?: string;
  autoFocus?: boolean;
  value?: CalendarValue;
  onChange?: (value: CalendarValue) => void;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  isDateUnavailable?: (date: DateValue) => boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  /** Which month opens when nothing is selected yet, so a picker opens where the value would go. */
  defaultFocusedValue?: DateValue | null;
  firstDayOfWeek?: DayOfWeek;
  pageBehavior?: PageBehavior;
}

export interface CalendarOwnerContext {
  props: ComputedRef<CalendarOwnedProps>;
}

/**
 * A calendar driven by whatever it sits inside.
 *
 * A date picker holds the value, the bounds and the verdict about them, so the calendar in its
 * popover cannot be told any of that in markup — the story writes `<Calendar>` with nothing on it
 * but a label. Mirrors what react-aria-components does with `CalendarContext`.
 *
 * Loose, and absent is the ordinary case: a calendar on its own owns everything it needs.
 */
export const [useCalendarOwnerContext, provideCalendarOwnerContext] =
  createContext<CalendarOwnerContext | null>({
    defaultValue: null,
    name: "CalendarOwnerContext",
    strict: false,
  });
