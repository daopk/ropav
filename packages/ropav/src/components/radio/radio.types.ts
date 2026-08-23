export interface RadioRootProps {
  class?: string;
  /** Value this radio contributes to the group's selection. Required. */
  value: string;
  /**
   * Disables this radio while the rest of the group stays usable. Read-only, required and
   * invalid are not per-radio: the group holds them, matching React.
   */
  isDisabled?: boolean;
  /**
   * Lands on the hidden input rather than on the wrapper, because the input is the radio as
   * far as assistive technology is concerned.
   */
  id?: string;
  /** Accessible name, for a radio with no visible label. */
  ariaLabel?: string;
  /** Ids of the elements that name the radio. */
  ariaLabelledby?: string;
  /** Ids of the elements that describe the radio, on top of any nested help text. */
  ariaDescribedby?: string;
}

export interface RadioContentProps {
  class?: string;
}

export interface RadioControlProps {
  class?: string;
}

export interface RadioIndicatorProps {
  class?: string;
}

/** State the root hands to its slot, matching React's field render props. */
export interface RadioSlotProps {
  isSelected: boolean;
  isDisabled: boolean;
  isReadOnly: boolean;
  isInvalid: boolean;
  isRequired: boolean;
}

/** State the clickable content hands to its slot; the field state plus the interaction states. */
export interface RadioContentSlotProps extends RadioSlotProps {
  isHovered: boolean;
  isPressed: boolean;
  isFocused: boolean;
  isFocusVisible: boolean;
}
