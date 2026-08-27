import type { TextAreaRootProps } from "@/components/textarea";

export interface TextAreaFixtureProps extends TextAreaRootProps {
  /** Wraps the control in a `TextField`, which is the only shape the suites used to cover. */
  inField?: boolean;
  /** The field's own value, for showing which of the two owns the text. */
  fieldValue?: string;
  /** The field's own placeholder, for the same reason. */
  fieldPlaceholder?: string;
  fieldVariant?: TextAreaRootProps["variant"];
  isFieldDisabled?: boolean;
  isFieldInvalid?: boolean;
  /** Wraps everything in a `<form>` with a real reset button. */
  withForm?: boolean;
  /** Native attributes the control takes by fallthrough rather than as declared props. */
  disabled?: boolean;
  required?: boolean;
  rows?: number;
}
