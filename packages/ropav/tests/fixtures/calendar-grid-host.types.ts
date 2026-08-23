import type {UseCalendarGridReturn} from "@/composables/use-calendar-grid";
import type {CalendarSelectionMode, CalendarState} from "@/composables/use-calendar-state";
import type {DayOfWeek, WeekdayStyle} from "@/utils/calendar";
import type {DateDuration, DateValue} from "@internationalized/date";

export interface CalendarGridHostProps {
  ariaLabel?: string;
  ariaLabelledby?: string;
  defaultFocusedValue?: DateValue | null;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  selectionMode?: CalendarSelectionMode;
  visibleDuration?: DateDuration;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  firstDayOfWeek?: DayOfWeek;
  weekdayStyle?: WeekdayStyle;
  locale?: string;
  /** Hands the live grid back to the test. */
  onReady?: (value: {grid: UseCalendarGridReturn; state: CalendarState}) => void;
}
