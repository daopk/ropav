import type {
  FormValidationErrors,
  ValidationBehavior,
  ValidationFunction,
} from "@/composables/use-form-validation-state";

export interface SearchFieldFixtureProps {
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
  /** Sets `full-width` as a bare attribute rather than a bound one, as a caller writes it. */
  attributeForm?: boolean;
  withLabel?: boolean;
  withDescription?: boolean;
  withFieldError?: boolean;
  /** Whether the search icon is rendered at all, which the control's padding keys on. */
  withSearchIcon?: boolean;
  /** Whether the clear button is rendered at all, which the control's padding keys on. */
  withClearButton?: boolean;
  /** Renders a custom icon through the slot instead of the built-in one. */
  customSearchIcon?: boolean;
  /** Renders custom content inside the clear button instead of the built-in icon. */
  customClearIcon?: boolean;
  /** Placeholder set on the control itself, to check a local prop beats the field's. */
  controlPlaceholder?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  onSubmit?: (value: string) => void;
}

export interface SearchFieldFormFixtureProps extends SearchFieldFixtureProps {
  validationErrors?: FormValidationErrors;
}
