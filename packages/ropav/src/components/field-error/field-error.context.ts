import type { ValidationResult } from "../../composables/use-form-validation-state";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface FieldErrorContext {
  /**
   * The owning field's currently displayed validation. One value rather than three parallel
   * refs, because the field produces all three together and they never move apart.
   */
  validation: ComputedRef<ValidationResult>;
}

/**
 * Loose, and `null` on purpose in two situations: a `FieldError` standing outside any field
 * renders nothing rather than throwing, and a field inside a checkbox or radio group hands
 * out `null` deliberately so the group's error is not repeated under every option.
 */
export const [useFieldErrorContext, provideFieldErrorContext] =
  createContext<FieldErrorContext | null>({
    defaultValue: null,
    name: "FieldErrorContext",
    strict: false,
  });
