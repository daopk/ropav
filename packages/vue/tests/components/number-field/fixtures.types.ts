import type {ValidationBehavior, ValidationFunction} from "@/composables/use-form-validation-state";
import type {NumberFieldCommitBehavior} from "@/composables/use-number-field-state";

export interface NumberFieldFixtureProps {
  class?: string;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  value?: number | null;
  defaultValue?: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  formatOptions?: Intl.NumberFormatOptions;
  commitBehavior?: NumberFieldCommitBehavior;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  isWheelDisabled?: boolean;
  validate?: ValidationFunction<number>;
  validationBehavior?: ValidationBehavior;
  name?: string;
  locale?: string;
  incrementAriaLabel?: string;
  decrementAriaLabel?: string;
  /** Sets `full-width` as a bare attribute rather than a bound one, as a caller writes it. */
  attributeForm?: boolean;
  withLabel?: boolean;
  withDescription?: boolean;
  withFieldError?: boolean;
  /** Whether either stepper button is rendered, which the group's columns key on. */
  withIncrement?: boolean;
  withDecrement?: boolean;
  /** Renders custom content inside each stepper instead of the built-in glyph. */
  customIcons?: boolean;
  onChange?: (value: number) => void;
}
