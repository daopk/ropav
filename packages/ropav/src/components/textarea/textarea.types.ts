import type { TextAreaVariants } from "@ropav/styles";

// Boolean props are declared as plain `boolean` rather than through the variants type. The
// SFC compiler cannot resolve an imported indexed-access type into a runtime prop type, and
// without `type: Boolean` Vue never casts a valueless attribute — `<X is-required>` would
// arrive as `""` and read as falsy, so the modifier silently never applies.
export interface TextAreaRootProps {
  class?: string;
  /**
   * Text in the control. Set here it takes the control over from the surrounding field, so the
   * caller owns the value even inside a `TextField` — exactly as a `value` prop does in React.
   * Without a listener to go with it the text is pinned.
   */
  value?: string;
  /** Visual variant. Taken from the surrounding field when unset. @default "primary" */
  variant?: TextAreaVariants["variant"];
  /**
   * How much room the text is given, matching a field of the same size. Taken from the
   * surrounding field when unset. @default "md"
   */
  size?: TextAreaVariants["size"];
  /** Whether the control stretches to fill its container. */
  fullWidth?: boolean;
  /**
   * Whether the control grows with its content. `minRows` and `maxRows` only apply when this
   * is set. Native resize is forced off while it is, so the drag handle cannot fight the
   * measured height. @default false
   */
  autosize?: boolean;
  /**
   * Minimum visible rows while `autosize` is set. Ignored otherwise. Written through to the
   * native `rows` attribute so the first paint is already that tall.
   */
  minRows?: number;
  /**
   * Maximum visible rows while `autosize` is set. Ignored otherwise. Absent, the control grows
   * without a cap.
   */
  maxRows?: number;
  /**
   * Whether the pointer can drag the edge. `none` by default; `vertical` or `both` opt in.
   * Ignored while `autosize` is set. @default "none"
   */
  resize?: TextAreaVariants["resize"];
  /**
   * Placeholder shown while the control is empty. Declared so it can also be set here rather
   * than only on the field; every other native attribute arrives by attribute fallthrough.
   */
  placeholder?: string;
}
