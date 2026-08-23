import type {
  ValidationBehavior,
  ValidationFunction,
} from "@/composables/use-form-validation-state";
import type { UseNumberFieldReturn } from "@/composables/use-number-field";
import type {
  NumberFieldCommitBehavior,
  NumberFieldState,
} from "@/composables/use-number-field-state";

export interface NumberFieldHostProps {
  value?: number | null;
  defaultValue?: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  formatOptions?: Intl.NumberFormatOptions;
  commitBehavior?: NumberFieldCommitBehavior;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  validate?: ValidationFunction<number>;
  validationBehavior?: ValidationBehavior;
  name?: string;
  locale?: string;
  onChange?: (value: number) => void;
  /** Hands the state out, since a composable cannot be reached from outside its component. */
  onReady: (state: NumberFieldState) => void;
}

export interface NumberFieldFullHostProps {
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
  validationBehavior?: ValidationBehavior;
  name?: string;
  locale?: string;
  ariaLabel?: string;
  incrementAriaLabel?: string;
  decrementAriaLabel?: string;
  /** Wraps the input in a form, so a real reset can be exercised. */
  withForm?: boolean;
  onChange?: (value: number) => void;
  /** Hands the composable out, since it cannot be reached from outside its component. */
  onReady: (field: UseNumberFieldReturn) => void;
}
