import type {SwitchVariants} from "@heroui/styles";

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
  /** Whether the value fails validation. */
  isInvalid?: boolean;
  /** Whether the switch has to be on for the form to submit. */
  isRequired?: boolean;
  /** Name submitted with the form. */
  name?: string;
  /** Value submitted with the form while the switch is on. @default "on" */
  value?: string;
  /** `id` of the form to submit with, for a switch rendered outside it. */
  form?: string;
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
