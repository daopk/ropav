import type {UseCalendarCellReturn} from "@/composables/use-calendar-cell";
import type {
  CalendarSelectionMode,
  CalendarState,
  CalendarValue,
} from "@/composables/use-calendar-state";
import type {DateDuration, DateValue} from "@internationalized/date";

export interface CalendarCellHostProps {
  value?: CalendarValue;
  defaultFocusedValue?: DateValue | null;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  selectionMode?: CalendarSelectionMode;
  visibleDuration?: DateDuration;
  isDateUnavailable?: (date: DateValue) => boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  autoFocus?: boolean;
  locale?: string;
  /** Hands the live cells back to the test, keyed by ISO date. */
  onReady?: (value: {cells: Map<string, UseCalendarCellReturn>; state: CalendarState}) => void;
}
