import type {
  FormValidationErrors,
  ValidationBehavior,
  ValidationFunction,
} from "@/composables/use-form-validation-state";

export interface TextFieldFixtureProps {
  class?: string;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  value?: string;
  defaultValue?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  validate?: ValidationFunction<string>;
  validationBehavior?: ValidationBehavior;
  name?: string;
  id?: string;
  type?: string;
  placeholder?: string;
  ariaLabel?: string;
  /** Renders a `TextArea` in place of the `Input`, which is the other control a field takes. */
  withTextArea?: boolean;
  /** Sets `full-width` as a bare attribute on the field and the control, as a caller writes it. */
  attributeForm?: boolean;
  /** Whether a visible `Label` is rendered at all. */
  withLabel?: boolean;
  withDescription?: boolean;
  withFieldError?: boolean;
  /** Variant set on the control itself, to check it beats the one from the field. */
  controlVariant?: "primary" | "secondary";
  /** Placeholder set on the control itself, to check a local prop beats the field's. */
  controlPlaceholder?: string;
  onChange?: (value: string) => void;
}

export interface TextFieldFormFixtureProps extends TextFieldFixtureProps {
  validationErrors?: FormValidationErrors;
}
