import type {DateRange} from "@/composables/use-calendar";
import type {PageBehavior, SelectionAlignment} from "@/composables/use-calendar-state";
import type {RangeCalendarState} from "@/composables/use-range-calendar-state";
import type {DayOfWeek} from "@/utils/calendar";
import type {CalendarDate, DateDuration, DateValue} from "@internationalized/date";

export interface RangeCalendarStateHostProps {
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onChange?: (value: DateRange | null) => void;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  allowsNonContiguousRanges?: boolean;
  isDateUnavailable?: (date: DateValue, anchorDate: CalendarDate | null) => boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  autoFocus?: boolean;
  focusedValue?: DateValue | null;
  defaultFocusedValue?: DateValue | null;
  onFocusChange?: (date: CalendarDate) => void;
  visibleDuration?: DateDuration;
  pageBehavior?: PageBehavior;
  selectionAlignment?: SelectionAlignment;
  firstDayOfWeek?: DayOfWeek;
  weeksInMonth?: number;
  locale?: string;
  /** Hands the live state back to the test. */
  onReady?: (state: RangeCalendarState) => void;
}
