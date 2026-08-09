import type {DateRange} from "@/composables/use-calendar";
import type {
  RangeCalendarCommitBehavior,
  UseRangeCalendarReturn,
} from "@/composables/use-range-calendar";
import type {RangeCalendarState} from "@/composables/use-range-calendar-state";
import type {DateDuration, DateValue} from "@internationalized/date";

export interface RangeCalendarHostProps {
  id?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  ariaDetails?: string;
  hasErrorMessage?: boolean;
  commitBehavior?: RangeCalendarCommitBehavior;
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onChange?: (value: DateRange | null) => void;
  defaultFocusedValue?: DateValue | null;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  visibleDuration?: DateDuration;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  locale?: string;
  /** Hands the live hooks back to the test. */
  onReady?: (value: {calendar: UseRangeCalendarReturn; state: RangeCalendarState}) => void;
}
