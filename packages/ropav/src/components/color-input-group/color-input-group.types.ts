import type {ColorInputGroupVariants} from "@heroui/styles";

// Boolean props are declared as plain `boolean` rather than through the variants type. The SFC
// compiler cannot resolve an imported indexed-access type into a runtime prop type, and without
// `type: Boolean` Vue never casts a valueless attribute — `<X full-width>` would arrive as `""`
// and read as falsy, so the modifier silently never applies.
export interface ColorInputGroupRootProps {
  class?: string;
  /** Visual variant. @default "primary" */
  variant?: ColorInputGroupVariants["variant"];
  /** Whether the group stretches to fill its container. */
  fullWidth?: boolean;
  /**
   * Whether the group reads as disabled. Taken from the surrounding field when unset, which is
   * how the field's own disabled state reaches the shell around the control.
   */
  isDisabled?: boolean;
  /** Whether the group reads as invalid. Taken from the surrounding field when unset. */
  isInvalid?: boolean;
}

/** State the root hands to its slot, matching React's group render props. */
export interface ColorInputGroupRootSlotProps {
  isHovered: boolean;
  isFocusWithin: boolean;
  isFocusVisible: boolean;
  isDisabled: boolean;
  isInvalid: boolean;
}

export interface ColorInputGroupInputProps {
  class?: string;
  /**
   * Placeholder shown while the control is empty. Declared so it can also be set here rather
   * than only on the field; every other native attribute arrives by attribute fallthrough.
   */
  placeholder?: string;
}

export interface ColorInputGroupPrefixProps {
  class?: string;
}

export interface ColorInputGroupSuffixProps {
  class?: string;
}
