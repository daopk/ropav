import type {
  ValidationBehavior,
  ValidationFunction,
} from "../../composables/use-form-validation-state";
import type {SwitchVariants} from "@ropav/styles";

export interface SwitchRootProps {
  class?: string;
  /** Size of the control. @default "md" */
  size?: SwitchVariants["size"];
  /** Whether the switch is on. Makes the switch controlled. */
  isSelected?: boolean;
  /** Whether the switch starts on, when it is uncontrolled. */
  defaultSelected?: boolean;
  /** Whether the switch is disabled — no interaction, no submission. */
  isDisabled?: boolean;
  /** Whether the value can be read but not changed. */
  isReadOnly?: boolean;
  /**
   * Whether the value fails validation. Setting it either way takes the field over: `false`
   * claims the switch is valid and shadows `validate`, the browser and the server alike.
   */
  isInvalid?: boolean;
  /** Checks the value and returns a message when it is not acceptable. */
  validate?: ValidationFunction<boolean>;
  /**
   * How the switch reports validation. Inherited from the surrounding form when unset.
   * @default "native"
   */
  validationBehavior?: ValidationBehavior;
  /** Whether the switch has to be on for the form to submit. */
  isRequired?: boolean;
  /** Name submitted with the form. */
  name?: string;
  /** Value submitted with the form while the switch is on. @default "on" */
  value?: string;
  /** `id` of the form to submit with, for a switch rendered outside it. */
  form?: string;
  /**
   * Lands on the hidden input rather than on the wrapper, because the input is the switch as
   * far as assistive technology is concerned.
   */
  id?: string;
  /** Accessible name, for a switch with no visible label. */
  ariaLabel?: string;
  /** Ids of the elements that name the switch. */
  ariaLabelledby?: string;
  /** Ids of the elements that describe the switch, on top of any nested help text. */
  ariaDescribedby?: string;
}

export interface SwitchContentProps {
  class?: string;
}

export interface SwitchControlProps {
  class?: string;
}

export interface SwitchThumbProps {
  class?: string;
}

export interface SwitchIconProps {
  class?: string;
}

/** State the root hands to its slot, matching React's field render props. */
export interface SwitchSlotProps {
  isSelected: boolean;
  isDisabled: boolean;
  isReadOnly: boolean;
  isInvalid: boolean;
  isRequired: boolean;
}

/** State the clickable content hands to its slot; the field state plus the interaction states. */
export interface SwitchContentSlotProps extends SwitchSlotProps {
  isHovered: boolean;
  isPressed: boolean;
  isFocused: boolean;
  isFocusVisible: boolean;
}
