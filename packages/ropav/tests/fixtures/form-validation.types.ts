import type {
  FormValidationErrors,
  FormValidationState,
  ValidationBehavior,
  RequiredControl,
  ValidationFunction,
  ValidationResult,
} from "@/composables/use-form-validation-state";

export interface FormValidationHostProps {
  // `string` leads on purpose: Vue casts `""` to `true` for a prop whose union puts `boolean`
  // ahead of `string`, which would hand the field a value where a test meant to hand it nothing.
  value?: string | boolean | string[] | null;
  isInvalid?: boolean;
  isRequired?: boolean;
  requiredControl?: RequiredControl;
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
  /** Stands in for the form's submit attempts, which is what reveals a missing value. */
  submitCount?: number;
  validationErrors?: FormValidationErrors;
  formValidationBehavior?: ValidationBehavior;
}
