import type {
  ValidationBehavior,
  ValidationFunction,
} from "../../composables/use-form-validation-state";
import type {CheckboxVariants} from "@heroui/styles";

export interface CheckboxRootProps {
  class?: string;
  /** Visual variant. Taken from the surrounding group when unset. @default "primary" */
  variant?: CheckboxVariants["variant"];
  /** Whether the checkbox is ticked. Makes it controlled, and is ignored inside a group. */
  isSelected?: boolean;
  /** Whether it starts ticked, when uncontrolled. */
  defaultSelected?: boolean;
  /** Shows the mixed state, for a checkbox standing in for a partly selected set. */
  isIndeterminate?: boolean;
  /** Whether the checkbox is disabled — no interaction, no submission. */
  isDisabled?: boolean;
  /** Whether the value can be read but not changed. */
  isReadOnly?: boolean;
  /**
   * Whether the value fails validation. Setting it either way takes the field over: `false`
   * claims the checkbox is valid and shadows `validate`, the browser and the server alike.
   * Ignored inside a group, which validates on the group's behalf.
   */
  isInvalid?: boolean;
  /** Whether it has to be ticked for the form to submit. */
  isRequired?: boolean;
  /** Checks the value and returns a message when it is not acceptable. */
  validate?: ValidationFunction<boolean>;
  /**
   * How the checkbox reports validation. Inherited from the surrounding form when unset.
   * @default "native"
   */
  validationBehavior?: ValidationBehavior;
  /** Name submitted with the form. Taken from the surrounding group when unset. */
  name?: string;
  /**
   * Value submitted with the form while the checkbox is ticked, and the value it contributes
   * to a surrounding group's selection. @default "on"
   */
  value?: string;
  /** `id` of the form to submit with, for a checkbox rendered outside it. */
  form?: string;
  /**
   * Lands on the hidden input rather than on the wrapper, because the input is the checkbox
   * as far as assistive technology is concerned.
   */
  id?: string;
  /** Accessible name, for a checkbox with no visible label. */
  ariaLabel?: string;
  /** Ids of the elements that name the checkbox. */
  ariaLabelledby?: string;
  /** Ids of the elements that describe the checkbox, on top of any nested help text. */
  ariaDescribedby?: string;
}

export interface CheckboxContentProps {
  class?: string;
}

export interface CheckboxControlProps {
  class?: string;
}

export interface CheckboxIndicatorProps {
  class?: string;
}

/** State the root hands to its slot, matching React's field render props. */
export interface CheckboxSlotProps {
  isSelected: boolean;
  isIndeterminate: boolean;
  isDisabled: boolean;
  isReadOnly: boolean;
  isInvalid: boolean;
  isRequired: boolean;
}

/** State the clickable content hands to its slot; the field state plus the interaction states. */
export interface CheckboxContentSlotProps extends CheckboxSlotProps {
  isHovered: boolean;
  isPressed: boolean;
  isFocused: boolean;
  isFocusVisible: boolean;
}
