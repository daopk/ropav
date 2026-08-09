import type {AnyCalendarState} from "../../composables/use-calendar";
import type {CalendarHeadingFormatOptions} from "../../composables/use-calendar-heading";
import type {
  CalendarSelectionMode,
  CalendarValue,
  PageBehavior,
  SelectionAlignment,
} from "../../composables/use-calendar-state";
import type {DayOfWeek, WeekdayStyle} from "../../utils/calendar";
import type {CalendarDate, DateDuration, DateValue} from "@internationalized/date";

/*
 * Boolean props are declared as plain `boolean` rather than through the variants type. The SFC
 * compiler cannot resolve an imported indexed-access type into a runtime prop type, and without
 * `type: Boolean` Vue never casts a valueless attribute — `<Calendar is-disabled>` would arrive as
 * `""` and read as falsy, so the modifier silently never applies.
 */
export interface CalendarRootProps {
  class?: string;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-details"?: string;
  value?: CalendarValue;
  defaultValue?: CalendarValue;
  focusedValue?: DateValue | null;
  defaultFocusedValue?: DateValue | null;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  /** Whether the calendar takes one date or several. @default "single" */
  selectionMode?: CalendarSelectionMode;
  /** Rules a date out even though it is inside the range. */
  isDateUnavailable?: (date: DateValue) => boolean;
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
export interface CalendarRootSlotProps {
  state: AnyCalendarState;
  isDisabled: boolean;
  isInvalid: boolean;
}

export interface CalendarHeaderProps {
  class?: string;
}

export interface CalendarHeadingProps {
  class?: string;
  /** How far past the first visible date this heading describes. */
  offset?: DateDuration;
  /** Overrides the parts the heading is written from. */
  format?: CalendarHeadingFormatOptions;
}

export interface CalendarNavButtonProps {
  class?: string;
  /** Which direction this button pages. @default "next" */
  slot?: "previous" | "next";
}

export interface CalendarGridProps {
  class?: string;
  /** How wide the weekday names above the grid are written. @default "short" */
  weekdayStyle?: WeekdayStyle;
  /** How far past the first visible date this grid starts, for a multi-month calendar. */
  offset?: DateDuration;
}

export interface CalendarGridHeaderProps {
  class?: string;
}

/** One weekday name per slot call. */
export interface CalendarGridHeaderSlotProps {
  day: string;
}

export interface CalendarGridBodyProps {
  class?: string;
}

/** One date per slot call, `null` where the calendar system runs out of days. */
export interface CalendarGridBodySlotProps {
  date: CalendarDate;
}

export interface CalendarHeaderCellProps {
  class?: string;
}

export interface CalendarCellProps {
  class?: string;
  /** The date this cell stands for. */
  date: CalendarDate;
}

/** State the cell hands its slot, matching React's render props. */
export interface CalendarCellSlotProps {
  date: CalendarDate;
  formattedDate: string;
  isHovered: boolean;
  isPressed: boolean;
  isSelected: boolean;
  isFocused: boolean;
  isFocusVisible: boolean;
  isDisabled: boolean;
  isOutsideVisibleRange: boolean;
  isOutsideMonth: boolean;
  isUnavailable: boolean;
  isInvalid: boolean;
  isToday: boolean;
}

export interface CalendarCellIndicatorProps {
  class?: string;
}
