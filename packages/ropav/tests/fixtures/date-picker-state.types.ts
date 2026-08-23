import type {
  DatePickerState,
  UseDatePickerStateOptions,
} from "@/composables/use-date-picker-state";
import type { ValidationBehavior } from "@/composables/use-form-validation-state";
import type { Granularity } from "@/utils/date-format";
import type { DateValue } from "@internationalized/date";

/**
 * Plain values, not `MaybeRefOrGetter` — a component's props are always resolved values, and
 * reusing the composable's option types here would make every forwarded prop a possible getter.
 */
export interface DatePickerStateHostProps {
  value?: DateValue | null;
  defaultValue?: DateValue | null;
  placeholderValue?: DateValue | null;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  isDateUnavailable?: (date: DateValue) => boolean;
  granularity?: Granularity;
  hourCycle?: 12 | 24;
  hideTimeZone?: boolean;
  shouldForceLeadingZeros?: boolean;
  isInvalid?: boolean;
  validate?: UseDatePickerStateOptions["validate"];
  validationBehavior?: ValidationBehavior;
  name?: string;
  shouldCloseOnSelect?: boolean | (() => boolean);
  isOpen?: boolean;
  defaultOpen?: boolean;
  onChange?: (value: DateValue | null) => void;
  onOpenChange?: (isOpen: boolean) => void;
  onReady?: (state: DatePickerState) => void;
}
