import type {
  FormValidationErrors,
  FormValidationState,
  ValidationBehavior,
  ValidationFunction,
  ValidationResult,
} from "@/composables/use-form-validation-state";

export interface FormValidationHostProps {
  value?: boolean | string | string[] | null;
  isInvalid?: boolean;
  validate?: ValidationFunction<never>;
  validationBehavior?: ValidationBehavior;
  name?: string | string[];
  builtinValidation?: ValidationResult;
  /** A state owned from outside, which the composable should report through rather than replace. */
  validationState?: FormValidationState;
  /** Hands the live state back so a test can drive it. */
  onReady?: (state: FormValidationState) => void;
}

export interface FormValidationHarnessProps extends FormValidationHostProps {
  /** Whether a surrounding form provides the context at all. */
  withForm?: boolean;
  validationErrors?: FormValidationErrors;
  formValidationBehavior?: ValidationBehavior;
}
