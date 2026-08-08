import type {ValidationDetails} from "@/composables/use-form-validation-state";

export interface FieldErrorFixtureProps {
  isInvalid?: boolean;
  validationErrors?: string[];
  validationDetails?: ValidationDetails;
  /** Renders a caller-supplied message instead of the default one. */
  withCustomMessage?: boolean;
  /** Leaves the field context out, as a `FieldError` standing on its own would. */
  withoutField?: boolean;
  class?: string;
}
