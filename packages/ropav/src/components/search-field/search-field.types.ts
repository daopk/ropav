import type {
  ValidationBehavior,
  ValidationDetails,
  ValidationFunction,
} from "../../composables/use-form-validation-state";
import type {SearchFieldVariants} from "@heroui/styles";

// Boolean props are declared as plain `boolean` rather than through the variants type. The
// SFC compiler cannot resolve an imported indexed-access type into a runtime prop type, and
// without `type: Boolean` Vue never casts a valueless attribute — `<X is-required>` would
// arrive as `""` and read as falsy, so the modifier silently never applies.
export interface SearchFieldRootProps {
  class?: string;
  /** Visual variant. @default "primary" */
  variant?: SearchFieldVariants["variant"];
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
  /** Lands on the control, which is the field as far as assistive technology is concerned. */
  id?: string;
  /** Kind of control the browser should offer. @default "search" */
  type?: string;
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
  /**
   * Called when the search is submitted from the keyboard.
   *
   * A prop rather than an emit, because its mere presence decides what Enter does: with a
   * handler the key is a submit and stops there, without one it belongs to the form, which
   * submits on Enter in a single-line field of its own accord. Vue strips a declared emit from
   * `$attrs`, so an emit gives the component no way to tell whether anyone is listening.
   */
  onSubmit?: (value: string) => void;
}

/** State the root hands to its slot, matching React's field render props. */
export interface SearchFieldRootSlotProps {
  isEmpty: boolean;
  isDisabled: boolean;
  isInvalid: boolean;
  isReadOnly: boolean;
  isRequired: boolean;
  /** What validation currently says, for a caller rendering its own message. */
  validationErrors: string[];
  validationDetails: ValidationDetails;
}

export interface SearchFieldGroupProps {
  class?: string;
}

/** State the group hands to its slot, matching React's group render props. */
export interface SearchFieldGroupSlotProps {
  isHovered: boolean;
  isFocusWithin: boolean;
  isFocusVisible: boolean;
  isDisabled: boolean;
  isInvalid: boolean;
}

export interface SearchFieldInputProps {
  class?: string;
  /**
   * Text in the control. Set here it takes the control over from the field, so the caller owns
   * the value — exactly as a `value` prop does in React. Without a listener to go with it the
   * text is pinned.
   */
  value?: string;
  /**
   * Placeholder shown while the control is empty. Declared so it can also be set here rather
   * than only on the field; every other native attribute arrives by attribute fallthrough.
   */
  placeholder?: string;
}

export interface SearchFieldSearchIconProps {
  class?: string;
}

export interface SearchFieldClearButtonProps {
  class?: string;
}
