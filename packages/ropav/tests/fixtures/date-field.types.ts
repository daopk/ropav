import type {UseDateFieldReturn} from "@/composables/use-date-field";
import type {DateFieldState} from "@/composables/use-date-field-state";
import type {ValidationBehavior} from "@/composables/use-form-validation-state";
import type {TimeFieldState} from "@/composables/use-time-field-state";
import type {Granularity, TimeValue} from "@/utils/date-format";
import type {DateValue} from "@internationalized/date";

/** The pieces a test reads once the field is mounted. */
export interface DateFieldReady {
  field: UseDateFieldReturn;
  state: DateFieldState;
}

export interface TimeFieldReady {
  field: UseDateFieldReturn;
  state: TimeFieldState;
}

interface SharedProps {
  /** Id for the group around the segments, which a picker hands its field. */
  id?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  autoFocus?: boolean;
  isDisabled?: boolean;
  isRequired?: boolean;
  name?: string;
  /** Renders a visible label, so the field's `aria-labelledby` has something to point at. */
  label?: string;
  description?: string;
  role?: "group" | "presentation";
  validationBehavior?: ValidationBehavior;
  onFocusChange?: (isFocused: boolean) => void;
}

export interface DateFieldHostProps extends SharedProps {
  value?: DateValue | null;
  defaultValue?: DateValue | null;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  granularity?: Granularity;
  onChange?: (value: DateValue | null) => void;
  onReady?: (ready: DateFieldReady) => void;
}

export interface TimeFieldHostProps extends SharedProps {
  value?: TimeValue | null;
  defaultValue?: TimeValue | null;
  onChange?: (value: TimeValue | null) => void;
  onReady?: (ready: TimeFieldReady) => void;
}

export interface DateFieldHarnessProps extends DateFieldHostProps {
  locale?: string;
}
