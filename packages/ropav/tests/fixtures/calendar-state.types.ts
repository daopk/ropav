import type {
  CalendarSelectionMode,
  CalendarState,
  CalendarValue,
  PageBehavior,
  SelectionAlignment,
} from "@/composables/use-calendar-state";
import type { DayOfWeek } from "@/utils/calendar";
import type { CalendarDate, DateDuration, DateValue } from "@internationalized/date";

export interface CalendarStateHostProps {
  value?: CalendarValue;
  defaultValue?: CalendarValue;
  onChange?: (value: CalendarValue) => void;
  selectionMode?: CalendarSelectionMode;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  isDateUnavailable?: (date: DateValue) => boolean;
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
  onReady?: (state: CalendarState) => void;
}
