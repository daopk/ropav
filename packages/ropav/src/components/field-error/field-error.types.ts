import type { ValidationDetails } from "../../composables/use-form-validation-state";

export interface FieldErrorRootProps {
  class?: string;
}

export interface FieldErrorContentProps {
  class?: string;
}

/** What the message slot is handed, in place of React's render-prop children. */
export interface FieldErrorSlotProps {
  /** Messages the field's validation produced, in the order they were reported. */
  validationErrors: string[];
  /** Which constraint failed, for a caller that wants to word the message itself. */
  validationDetails: ValidationDetails;
}
