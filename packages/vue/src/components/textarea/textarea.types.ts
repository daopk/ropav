import type {TextAreaVariants} from "@heroui/styles";

// Boolean props are declared as plain `boolean` rather than through the variants type. The
// SFC compiler cannot resolve an imported indexed-access type into a runtime prop type, and
// without `type: Boolean` Vue never casts a valueless attribute — `<X is-required>` would
// arrive as `""` and read as falsy, so the modifier silently never applies.
export interface TextAreaRootProps {
  class?: string;
  /** Visual variant. Taken from the surrounding field when unset. @default "primary" */
  variant?: TextAreaVariants["variant"];
  /** Whether the control stretches to fill its container. */
  fullWidth?: boolean;
  /**
   * Placeholder shown while the control is empty. Declared so it can also be set here rather
   * than only on the field; every other native attribute arrives by attribute fallthrough.
   */
  placeholder?: string;
}
