import type {CheckboxGroupRootProps} from "@/components/checkbox-group";

export interface CheckboxGroupFixtureProps extends CheckboxGroupRootProps {
  /** Item values to render a checkbox for. @default ["email", "sms", "push"] */
  items?: string[];
  /** Renders a visible label for the group. */
  withLabel?: boolean;
  /** Renders help text for the group. */
  withDescription?: boolean;
  /** Renders the group's own `FieldError`. */
  withFieldError?: boolean;
  /** Renders a `FieldError` inside the first checkbox, which the group should silence. */
  withItemFieldError?: boolean;
  /** Disables the first item on its own, over the group's setting. */
  itemDisabled?: boolean;
  /** Gives the first item a variant of its own. */
  itemVariant?: "primary" | "secondary";
  /** Wraps the group in a form with a submit button. */
  withForm?: boolean;
  formValidationErrors?: Record<string, string | string[]>;
}
