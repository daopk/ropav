import type {RadioGroupRootProps} from "@/components/radio-group";

export interface RadioGroupFixtureProps extends RadioGroupRootProps {
  /** Item values to render a radio for. @default ["basic", "premium", "team"] */
  items?: string[];
  /** Values whose radio is disabled on its own. */
  disabledItems?: string[];
  withLabel?: boolean;
  withDescription?: boolean;
  /** Renders the group's own `FieldError`. */
  withFieldError?: boolean;
  /** Renders a `FieldError` inside the first radio, which the group should answer for. */
  withItemFieldError?: boolean;
  /** Renders help text inside the first radio. */
  withItemDescription?: boolean;
  /** Replaces the drawn dot with the caller's own mark. */
  withCustomIndicator?: boolean;
  /** Wraps the group in a form with a submit button. */
  withForm?: boolean;
  formValidationErrors?: Record<string, string | string[]>;
}
