import type {InputGroupVariants} from "@heroui/styles";

// Boolean props are declared as plain `boolean` rather than through the variants type. The
// SFC compiler cannot resolve an imported indexed-access type into a runtime prop type, and
// without `type: Boolean` Vue never casts a valueless attribute — `<X full-width>` would
// arrive as `""` and read as falsy, so the modifier silently never applies.
export interface InputGroupRootProps {
  class?: string;
  /** Visual variant. Taken from the surrounding field when unset. @default "primary" */
  variant?: InputGroupVariants["variant"];
  /** Whether the group stretches to fill its container. */
  fullWidth?: boolean;
  /**
   * Whether the group reads as disabled. Taken from the surrounding field when unset, which
   * is how the field's own disabled state reaches the shell around the control.
   */
  isDisabled?: boolean;
  /** Whether the group reads as invalid. Taken from the surrounding field when unset. */
  isInvalid?: boolean;
  /**
   * Whether the group reads as read-only. Never inherited: a field does not hand this one
   * down, so it only ever comes from here, matching React.
   */
  isReadOnly?: boolean;
}

/** State the root hands to its slot, matching React's group render props. */
export interface InputGroupRootSlotProps {
  isHovered: boolean;
  isFocusWithin: boolean;
  isFocusVisible: boolean;
  isDisabled: boolean;
  isInvalid: boolean;
}

/** Shared by the two controls the group can hold. */
interface InputGroupControlProps {
  class?: string;
  /**
   * Text in the control. Set here it takes the control over from the surrounding field, so
   * the caller owns the value even inside a `TextField` — exactly as a `value` prop does in
   * React. Without a listener to go with it the text is pinned.
   */
  value?: string;
  /**
   * Placeholder shown while the control is empty. Declared so it can also be set here rather
   * than only on the field; every other native attribute arrives by attribute fallthrough.
   */
  placeholder?: string;
}

export interface InputGroupInputProps extends InputGroupControlProps {}

export interface InputGroupTextAreaProps extends InputGroupControlProps {}

export interface InputGroupPrefixProps {
  class?: string;
}

export interface InputGroupSuffixProps {
  class?: string;
}
