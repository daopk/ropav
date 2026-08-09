import type {DateFieldState, UseDateFieldStateOptions} from "@/composables/use-date-field-state";
import type {ValidationBehavior} from "@/composables/use-form-validation-state";
import type {Granularity, MaxGranularity} from "@/utils/date-format";
import type {DateValue} from "@internationalized/date";

/**
 * Plain values, not `MaybeRefOrGetter` — a component's props are always resolved values, and
 * reusing the composable's option types here would make every forwarded prop a possible getter.
 */
export interface DateFieldStateHostProps {
  value?: DateValue | null;
  defaultValue?: DateValue | null;
  placeholderValue?: DateValue | null;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  isDateUnavailable?: (date: DateValue) => boolean;
  granularity?: Granularity;
  maxGranularity?: MaxGranularity;
  hourCycle?: 12 | 24;
  hideTimeZone?: boolean;
  shouldForceLeadingZeros?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  validate?: UseDateFieldStateOptions["validate"];
  validationBehavior?: ValidationBehavior;
  name?: string;
  locale?: string;
  onChange?: (value: DateValue | null) => void;
  /** Overrides the calendar factory, so a test can prove the injection point works. */
  createCalendar?: UseDateFieldStateOptions["createCalendar"];
  onReady?: (state: DateFieldState) => void;
}
