import type {
  ValidationBehavior,
  ValidationDetails,
  ValidationFunction,
} from "../../composables/use-form-validation-state";

// Boolean props are declared as plain `boolean` rather than through the variants type. The
// SFC compiler cannot resolve an imported indexed-access type into a runtime prop type, and
// without `type: Boolean` Vue never casts a valueless attribute — `<X is-required>` would
// arrive as `""` and read as falsy, so the modifier silently never applies.
export interface TextFieldRootProps {
  class?: string;
  /** Visual variant handed down to the control inside. @default "primary" */
  variant?: "primary" | "secondary";
  /** Whether the field stretches to fill its container. */
  fullWidth?: boolean;
  /** Text in the field. Makes it controlled. */
  value?: string;
  /** Text the field starts with, and goes back to when the form is reset. */
  defaultValue?: string;
  /** Whether the field is disabled — no interaction, no submission. */
  isDisabled?: boolean;
  /** Whether the text can be read but not changed. */
  isReadOnly?: boolean;
  /** Whether the field has to be filled in for the form to submit. */
  isRequired?: boolean;
  /**
   * Whether the value fails validation. Setting it either way takes the field over: `false`
   * claims the field is valid and shadows `validate`, the browser and the server alike.
   */
  isInvalid?: boolean;
  /** Checks the value and returns a message when it is not acceptable. */
  validate?: ValidationFunction<string>;
  /**
   * How the field reports validation. Inherited from the surrounding form when unset.
   * @default "native"
   */
  validationBehavior?: ValidationBehavior;
  /** Name submitted with the form. */
  name?: string;
  /** `id` of the form to submit with, for a field rendered outside it. */
  form?: string;
  /**
   * Lands on the control rather than on the wrapper, because the control is the field as far
   * as assistive technology is concerned, and is what the label points `for` at.
   */
  id?: string;
  /** Kind of control the browser should offer. Ignored by a textarea. @default "text" */
  type?: string;
  /** Value pattern the browser enforces. Ignored by a textarea. */
  pattern?: string;
  /** Placeholder shown while the field is empty. */
  placeholder?: string;
  /** Whether the field takes focus on mount. */
  autoFocus?: boolean;
  autoComplete?: string;
  autoCapitalize?: string;
  autoCorrect?: string;
  spellCheck?: string | boolean;
  /** Keyboard the browser should offer on a touch device. */
  inputMode?: string;
  /** Action label for the enter key on a virtual keyboard. */
  enterKeyHint?: string;
  maxLength?: number;
  minLength?: number;
  /** Accessible name, for a field with no visible label. */
  ariaLabel?: string;
  /** Ids of the elements that name the field. */
  ariaLabelledby?: string;
  /** Ids of the elements that describe the field, on top of any nested help text. */
  ariaDescribedby?: string;
}

/** State the root hands to its slot, matching React's field render props. */
export interface TextFieldSlotProps {
  isDisabled: boolean;
  isInvalid: boolean;
  isReadOnly: boolean;
  isRequired: boolean;
  /** What validation currently says, for a caller rendering its own message. */
  validationErrors: string[];
  validationDetails: ValidationDetails;
}
