export interface InputGroupFixtureProps {
  class?: string;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  isDisabled?: boolean;
  isInvalid?: boolean;
  isReadOnly?: boolean;
  /** Wraps the group in a `TextField`, which is how every story uses it. */
  withField?: boolean;
  /** Field-level state, to check the group picks it up when it declares none of its own. */
  fieldIsDisabled?: boolean;
  fieldIsInvalid?: boolean;
  fieldVariant?: "primary" | "secondary";
  fieldDefaultValue?: string;
  withPrefix?: boolean;
  withSuffix?: boolean;
  /** Renders a button in the suffix, to check a click there still lands on the control. */
  withSuffixButton?: boolean;
  /** Renders a `TextArea` in place of the `Input`, which is the other control the group takes. */
  withTextArea?: boolean;
  /** Sets `full-width` as a bare attribute rather than a bound one, as a caller writes it. */
  attributeForm?: boolean;
  /** Value owned by the control itself, which takes it over from the field. */
  controlValue?: string;
  controlPlaceholder?: string;
  onControlChange?: (value: string) => void;
}
