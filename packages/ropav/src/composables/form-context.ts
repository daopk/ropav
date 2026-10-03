import type { FormValidationErrors, ValidationBehavior } from "./use-form-validation-state";
import type { ComputedRef, Ref } from "vue";

import { createContext } from "../utils/create-context";

export interface FormContext {
  /** Errors keyed by field `name`, shown until the user edits the value. */
  validationErrors: ComputedRef<FormValidationErrors>;
  /** Default for every field inside, unless the field names its own. */
  validationBehavior: ComputedRef<ValidationBehavior>;
  /**
   * Bumped by every submit attempt.
   *
   * Under `"native"` a field learns of a failed submit from the browser, which fires `invalid` at
   * it. Under `"aria"` the browser is not involved, so this is the only thing that tells a field
   * holding an unrevealed error that it is now being asked for.
   */
  submitCount?: Readonly<Ref<number>>;
}

/**
 * React splits this in two — `FormValidationContext` in react-stately for the errors,
 * `FormContext` in react-aria-components for the behaviour — only because the two live in
 * different packages. Here one provider hands out both, so a field injects once and the two
 * halves cannot drift apart.
 *
 * Loose: a field outside a form is the normal case, not an error.
 */
export const [useFormContext, provideFormContext] = createContext<FormContext | null>({
  defaultValue: null,
  name: "FormContext",
  strict: false,
});
