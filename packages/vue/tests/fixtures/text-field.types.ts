import type {
  FormValidationState,
  ValidationBehavior,
  ValidationFunction,
} from "@/composables/use-form-validation-state";
import type {UseTextFieldReturn} from "@/composables/use-text-field";

export interface TextFieldHostProps {
  value?: string;
  defaultValue?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  validate?: ValidationFunction<string>;
  validationBehavior?: ValidationBehavior;
  validationState?: FormValidationState;
  skipFormReset?: boolean;
  id?: string;
  name?: string;
  type?: string;
  pattern?: string;
  autoFocus?: boolean;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  /** Which control the field renders, since that is what decides `type` and `pattern`. */
  elementType?: "input" | "textarea";
  onChange?: (value: string) => void;
  onFocusChange?: (isFocused: boolean) => void;
  onKeydownForward?: (event: KeyboardEvent) => void;
  onKeyupForward?: (event: KeyboardEvent) => void;
  /** Hands the live field back so a test can read its attributes and call its handlers. */
  onReady?: (field: UseTextFieldReturn) => void;
}

export interface TextFieldHarnessProps extends TextFieldHostProps {
  /** Whether the control sits inside a real form, for the reset path. */
  withForm?: boolean;
  /** Cancels the form reset from the template, so the listener is in place before the field's. */
  cancelReset?: boolean;
}
