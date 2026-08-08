import type {ValidationBehavior, ValidationFunction} from "@/composables/use-form-validation-state";
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
