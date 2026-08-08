// Boolean props are declared as plain `boolean` rather than through the variants type. The
// SFC compiler cannot resolve an imported indexed-access type into a runtime prop type, and
// without `type: Boolean` Vue never casts a valueless attribute — `<X is-required>` would
// arrive as `""` and read as falsy, so the modifier silently never applies.
export interface LabelRootProps {
  class?: string;
  /** Dims the label to match a disabled control. */
  isDisabled?: boolean;
  /** Marks the label as belonging to a control that failed validation. */
  isInvalid?: boolean;
  /** Renders the required marker. */
  isRequired?: boolean;
}
