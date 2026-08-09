import type {AnyCalendarState, DateRange} from "../../composables/use-calendar";
import type {CalendarHeadingFormatOptions} from "../../composables/use-calendar-heading";
import type {PageBehavior, SelectionAlignment} from "../../composables/use-calendar-state";
import type {RangeCalendarCommitBehavior} from "../../composables/use-range-calendar";
import type {DayOfWeek, WeekdayStyle} from "../../utils/calendar";
import type {CalendarDate, DateDuration, DateValue} from "@internationalized/date";

/*
 * Boolean props are declared as plain `boolean` rather than through the variants type. The SFC
 * compiler cannot resolve an imported indexed-access type into a runtime prop type, and without
 * `type: Boolean` Vue never casts a valueless attribute — `<RangeCalendar is-disabled>` would
 * arrive as `""` and read as falsy, so the modifier silently never applies.
 */
export interface RangeCalendarRootProps {
  class?: string;
  id?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  ariaDetails?: string;
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  focusedValue?: DateValue | null;
  defaultFocusedValue?: DateValue | null;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  /**
   * Rules a date out even though it is inside the range.
   *
   * The end the user pinned first comes along, so what is available can depend on where the range
   * started.
   */
  isDateUnavailable?: (date: DateValue, anchorDate: CalendarDate | null) => boolean;
  /** Whether a range may span an unavailable date. */
  allowsNonContiguousRanges?: boolean;
  /** What to do with a half-built range when the pointer or focus leaves. @default "select" */
  commitBehavior?: RangeCalendarCommitBehavior;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  /** Whether the calendar takes focus as soon as it mounts. */
  autoFocus?: boolean;
  /** How much is on screen at once, which is also what paging moves by. @default {months: 1} */
  visibleDuration?: DateDuration;
  /** @default "visible" */
  pageBehavior?: PageBehavior;
  /** @default "center" */
  selectionAlignment?: SelectionAlignment;
  /** The day a week starts on, when it should not follow the locale. */
  firstDayOfWeek?: DayOfWeek;
  /** A fixed number of week rows, so a month grid does not change height while paging. */
  weeksInMonth?: number;
  /** Whether the year picker is open. */
  isYearPickerOpen?: boolean;
  defaultYearPickerOpen?: boolean;
}

/** State the calendar hands its slot, matching React's render props. */
export interface RangeCalendarRootSlotProps {
  state: AnyCalendarState;
  isDisabled: boolean;
  isInvalid: boolean;
}

export interface RangeCalendarHeaderProps {
  class?: string;
}

export interface RangeCalendarHeadingProps {
  class?: string;
  /** How far past the first visible date this heading describes. */
  offset?: DateDuration;
  /** Overrides the parts the heading is written from. */
  format?: CalendarHeadingFormatOptions;
}

export interface RangeCalendarNavButtonProps {
  class?: string;
  /** Which direction this button pages. @default "next" */
  slot?: "previous" | "next";
}

export interface RangeCalendarGridProps {
  class?: string;
  /** How wide the weekday names above the grid are written. @default "short" */
  weekdayStyle?: WeekdayStyle;
  /** How far past the first visible date this grid starts, for a multi-month calendar. */
  offset?: DateDuration;
}

export interface RangeCalendarGridHeaderProps {
  class?: string;
}

/** One weekday name per slot call. */
export interface RangeCalendarGridHeaderSlotProps {
  day: string;
}

export interface RangeCalendarGridBodyProps {
  class?: string;
}

/** One date per slot call, skipped where the calendar system runs out of days. */
export interface RangeCalendarGridBodySlotProps {
  date: CalendarDate;
}

export interface RangeCalendarHeaderCellProps {
  class?: string;
}

export interface RangeCalendarCellProps {
  class?: string;
  /** The date this cell stands for. */
  date: CalendarDate;
}

/** State the cell hands its slot, matching React's render props. */
export interface RangeCalendarCellSlotProps {
  date: CalendarDate;
  formattedDate: string;
  isHovered: boolean;
  isPressed: boolean;
  isSelected: boolean;
  /** Whether this cell is the earlier end of the range, which is styled apart from the middle. */
  isSelectionStart: boolean;
  isSelectionEnd: boolean;
  isFocused: boolean;
  isFocusVisible: boolean;
  isDisabled: boolean;
  isOutsideVisibleRange: boolean;
  isOutsideMonth: boolean;
  isUnavailable: boolean;
  isInvalid: boolean;
  isToday: boolean;
}

export interface RangeCalendarCellIndicatorProps {
  class?: string;
}
