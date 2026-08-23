import type {
  FormValidationErrors,
  FormValidationState,
  ValidationBehavior,
  ValidationFunction,
} from "@/composables/use-form-validation-state";

export interface FormValidationInputProps {
  isInvalid?: boolean;
  validate?: ValidationFunction<boolean>;
  validationBehavior?: ValidationBehavior;
  name?: string;
  /** Renders `required` on the input, so the browser has a constraint of its own to fail. */
  isRequired?: boolean;
  isDisabled?: boolean;
  commitOnBlur?: boolean;
  /** Title already on the element, so the Firefox workaround has something to leave alone. */
  title?: string;
  /** A required field rendered *before* this one, to test which one a failed submit focuses. */
  withLeadingInput?: boolean;
  /** Cancels the form's reset, declaratively, so the listener order is deterministic. */
  preventReset?: boolean;
  /** Uses a caller-supplied focus handler rather than focusing the input itself. */
  onFocusField?: () => void;
  onReady?: (state: FormValidationState) => void;
  onInputElement?: (input: HTMLInputElement) => void;
  validationErrors?: FormValidationErrors;
  withForm?: boolean;
}
