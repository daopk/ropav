import type {UseCalendarReturn} from "@/composables/use-calendar";
import type {
  CalendarSelectionMode,
  CalendarState,
  CalendarValue,
} from "@/composables/use-calendar-state";
import type {DateDuration, DateValue} from "@internationalized/date";

export interface CalendarHostProps {
  id?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  ariaDetails?: string;
  hasErrorMessage?: boolean;
  value?: CalendarValue;
  defaultValue?: CalendarValue;
  defaultFocusedValue?: DateValue | null;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  selectionMode?: CalendarSelectionMode;
  visibleDuration?: DateDuration;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  locale?: string;
  /** Hands the live hooks back to the test. */
  onReady?: (value: {calendar: UseCalendarReturn; state: CalendarState}) => void;
}
