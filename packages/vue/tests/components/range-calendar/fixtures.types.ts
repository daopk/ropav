import type {DateRange} from "@/composables/use-calendar";
import type {PageBehavior, SelectionAlignment} from "@/composables/use-calendar-state";
import type {RangeCalendarCommitBehavior} from "@/composables/use-range-calendar";
import type {DayOfWeek, WeekdayStyle} from "@/utils/calendar";
import type {CalendarDate, DateDuration, DateValue} from "@internationalized/date";

export interface RangeCalendarFixtureProps {
  class?: string;
  id?: string;
  ariaLabel?: string;
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  focusedValue?: DateValue | null;
  defaultFocusedValue?: DateValue | null;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  isDateUnavailable?: (date: DateValue, anchorDate: CalendarDate | null) => boolean;
  allowsNonContiguousRanges?: boolean;
  commitBehavior?: RangeCalendarCommitBehavior;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  autoFocus?: boolean;
  visibleDuration?: DateDuration;
  pageBehavior?: PageBehavior;
  selectionAlignment?: SelectionAlignment;
  firstDayOfWeek?: DayOfWeek;
  weeksInMonth?: number;
  weekdayStyle?: WeekdayStyle;
  isYearPickerOpen?: boolean;
  defaultYearPickerOpen?: boolean;
  locale?: string;
  onValueChange?: (value: DateRange | null) => void;
  /** Renders the year-picker trigger and grid instead of a plain heading. */
  withYearPicker?: boolean;
  /** Renders a second grid, for the multi-month layout. */
  withSecondMonth?: boolean;
  /** Renders an indicator inside every cell. */
  withCellIndicator?: boolean;
  /** Sets boolean props as bare attributes, as a caller writes them. */
  attributeForm?: boolean;
}
