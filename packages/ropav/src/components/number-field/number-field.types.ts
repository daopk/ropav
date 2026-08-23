import type {
  ValidationBehavior,
  ValidationDetails,
  ValidationFunction,
} from "../../composables/use-form-validation-state";
import type { NumberFieldCommitBehavior } from "../../composables/use-number-field-state";
import type { NumberFieldVariants } from "@ropav/styles";

// Boolean props are declared as plain `boolean` rather than through the variants type. The
// SFC compiler cannot resolve an imported indexed-access type into a runtime prop type, and
// without `type: Boolean` Vue never casts a valueless attribute — `<X is-required>` would
// arrive as `""` and read as falsy, so the modifier silently never applies.
export interface NumberFieldRootProps {
  class?: string;
  /** Visual variant. @default "primary" */
  variant?: NumberFieldVariants["variant"];
  /** Whether the field stretches to fill its container. */
  fullWidth?: boolean;
  /** The number in the field. Makes it controlled. `null` means no number at all. */
  value?: number | null;
  /** The number the field starts with, and goes back to when the form is reset. */
  defaultValue?: number;
  minValue?: number;
  maxValue?: number;
  /** How far one step moves the value. @default 1, or 0.01 for a percentage */
  step?: number;
  /** How the number is written, and by extension which characters may be typed. */
  formatOptions?: Intl.NumberFormatOptions;
  /**
   * What happens to the value once the user is done editing. `"snap"` pulls it into range and
   * onto a step; `"validate"` leaves it and lets validation object.
   * @default "snap"
   */
  commitBehavior?: NumberFieldCommitBehavior;
  /** Whether the field is disabled — no interaction, no submission. */
  isDisabled?: boolean;
  /** Whether the number can be read but not changed. */
  isReadOnly?: boolean;
  /** Whether the field has to be filled in for the form to submit. */
  isRequired?: boolean;
  /**
   * Whether the value fails validation. Setting it either way takes the field over: `false`
   * claims the field is valid and shadows `validate`, the browser and the server alike.
   */
  isInvalid?: boolean;
  /** Checks the number and returns a message when it is not acceptable. */
  validate?: ValidationFunction<number>;
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
  /** Whether the field takes focus on mount. */
  autoFocus?: boolean;
  /** Whether the wheel over a focused field is ignored. */
  isWheelDisabled?: boolean;
  /** Locale the number is written and read in. Defaults to the runtime's own. */
  locale?: string;
  /** Accessible name, for a field with no visible label. */
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  /** Overrides the name the increment button announces. */
  incrementAriaLabel?: string;
  /** Overrides the name the decrement button announces. */
  decrementAriaLabel?: string;
}

/** State the root hands to its slot, matching React's field render props. */
export interface NumberFieldRootSlotProps {
  isDisabled: boolean;
  isInvalid: boolean;
  isReadOnly: boolean;
  isRequired: boolean;
  /** The number currently in the field, or `NaN` when there is none. */
  numberValue: number;
  validationErrors: string[];
  validationDetails: ValidationDetails;
}

export interface NumberFieldGroupProps {
  class?: string;
}

/** State the group hands to its slot, matching React's group render props. */
export interface NumberFieldGroupSlotProps {
  isHovered: boolean;
  isFocusWithin: boolean;
  isDisabled: boolean;
  isInvalid: boolean;
}

export interface NumberFieldInputProps {
  class?: string;
  placeholder?: string;
}

export interface NumberFieldStepperButtonProps {
  class?: string;
}
