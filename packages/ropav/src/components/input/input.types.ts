import type { InputVariants } from "@ropav/styles";

// Boolean props are declared as plain `boolean` rather than through the variants type. The
// SFC compiler cannot resolve an imported indexed-access type into a runtime prop type, and
// without `type: Boolean` Vue never casts a valueless attribute — `<X is-required>` would
// arrive as `""` and read as falsy, so the modifier silently never applies.
export interface InputRootProps {
  class?: string;
  /**
   * Text in the control. Set here it takes the control over from the surrounding field, so the
   * caller owns the value even inside a `TextField` — exactly as a `value` prop does in React.
   * Without a listener to go with it the text is pinned.
   */
  value?: string;
  /** Visual variant. Taken from the surrounding field when unset. @default "primary" */
  variant?: InputVariants["variant"];
  /**
   * How tall the control stands, matching a button of the same size. Taken from the surrounding
   * field when unset. @default "md"
   */
  size?: InputVariants["size"];
  /** Whether the control stretches to fill its container. */
  fullWidth?: boolean;
  /**
   * Placeholder shown while the control is empty. Declared so it can also be set here rather
   * than only on the field; every other native attribute arrives by attribute fallthrough.
   */
  placeholder?: string;
}
