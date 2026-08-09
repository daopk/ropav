import type {ValidationBehavior} from "@/composables/use-form-validation-state";
import type {Granularity} from "@/utils/date-format";
import type {DateValue} from "@internationalized/date";

export interface DateFieldFixtureProps {
  class?: string;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  value?: DateValue | null;
  defaultValue?: DateValue | null;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  granularity?: Granularity;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  validationBehavior?: ValidationBehavior;
  name?: string;
  locale?: string;
  ariaLabel?: string;
  /** Sets `full-width` as a bare attribute rather than a bound one, as a caller writes it. */
  attributeForm?: boolean;
  withLabel?: boolean;
  withDescription?: boolean;
  withFieldError?: boolean;
  withPrefix?: boolean;
  withSuffix?: boolean;
}
