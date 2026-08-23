import type {CheckboxRootProps} from "@/components/checkbox";

export interface CheckboxFixtureProps extends CheckboxRootProps {
  /** Renders help text as a sibling of the clickable content. */
  withDescription?: boolean;
  /** Renders a `FieldError` as a sibling of the clickable content. */
  withFieldError?: boolean;
  /** Words the error itself instead of showing what validation produced. */
  withCustomError?: boolean;
  /** Replaces the default tick with the caller's own mark. */
  withCustomIndicator?: boolean;
}
