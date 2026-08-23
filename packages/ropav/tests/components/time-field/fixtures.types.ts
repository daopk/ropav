import type { ValidationBehavior } from "@/composables/use-form-validation-state";
import type { TimeGranularity } from "@/composables/use-time-field-state";
import type { TimeValue } from "@/utils/date-format";

export interface TimeFieldFixtureProps {
  class?: string;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  value?: TimeValue | null;
  defaultValue?: TimeValue | null;
  minValue?: TimeValue | null;
  maxValue?: TimeValue | null;
  granularity?: TimeGranularity;
  hourCycle?: 12 | 24;
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
  withPrefix?: boolean;
  withSuffix?: boolean;
}
