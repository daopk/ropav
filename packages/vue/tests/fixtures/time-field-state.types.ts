import type {ValidationBehavior} from "@/composables/use-form-validation-state";
import type {
  TimeFieldState,
  TimeGranularity,
  UseTimeFieldStateOptions,
} from "@/composables/use-time-field-state";
import type {TimeValue} from "@/utils/date-format";

/**
 * Plain values, not `MaybeRefOrGetter` — a component's props are always resolved values, and
 * reusing the composable's option types here would make every forwarded prop a possible getter.
 */
export interface TimeFieldStateHostProps {
  value?: TimeValue | null;
  defaultValue?: TimeValue | null;
  placeholderValue?: TimeValue | null;
  minValue?: TimeValue | null;
  maxValue?: TimeValue | null;
  granularity?: TimeGranularity;
  hourCycle?: 12 | 24;
  hideTimeZone?: boolean;
  shouldForceLeadingZeros?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  validate?: UseTimeFieldStateOptions["validate"];
  validationBehavior?: ValidationBehavior;
  name?: string;
  locale?: string;
  onChange?: (value: TimeValue | null) => void;
  onReady?: (state: TimeFieldState) => void;
}
