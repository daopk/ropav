import type {
  FormValidationErrors,
  ValidationBehavior,
} from "../../composables/use-form-validation-state";

export interface FormRootProps {
  class?: string;
  /**
   * Errors returned by a server, keyed by the `name` each field submits under. A field shows
   * its error until the user acts on it, and shows it again whenever a new response arrives.
   */
  validationErrors?: FormValidationErrors;
  /**
   * How the fields inside report validation. `"native"` hands errors to the browser, which
   * blocks submission and reveals them on submit; `"aria"` marks the fields through ARIA and
   * leaves submission alone.
   * @default "native"
   */
  validationBehavior?: ValidationBehavior;
}
