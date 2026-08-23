import type { FormValidationState } from "../../composables/use-form-validation-state";
import type { checkboxVariants } from "@ropav/styles";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface CheckboxContext {
  slots: ComputedRef<ReturnType<typeof checkboxVariants>>;
  isSelected: ComputedRef<boolean>;
  isIndeterminate: ComputedRef<boolean>;
  isDisabled: ComputedRef<boolean>;
  isReadOnly: ComputedRef<boolean>;
  /** What validation currently says, after the behaviour has decided to reveal it. */
  isInvalid: ComputedRef<boolean>;
  isRequired: ComputedRef<boolean>;
  /** The field's validation, for the hidden input to wire the browser up to. */
  validation: FormValidationState;
  /**
   * Hands the hidden input to the surrounding group, which has no native constraint of its
   * own and reads validity off its items instead. `null` for a checkbox standing alone.
   */
  registerInput: ((input: HTMLInputElement) => () => void) | null;
  /** Value the hidden input goes back to when the surrounding form is reset. */
  defaultSelected: ComputedRef<boolean>;
  /** Ids of the help text describing this checkbox, its group's, and the caller's own. */
  describedBy: ComputedRef<string | undefined>;
  id: ComputedRef<string | undefined>;
  ariaLabel: ComputedRef<string | undefined>;
  ariaLabelledby: ComputedRef<string | undefined>;
  name: ComputedRef<string | undefined>;
  value: ComputedRef<string | undefined>;
  form: ComputedRef<string | undefined>;
  setSelected: (isSelected: boolean) => void;
}

export const [useCheckboxContext, provideCheckboxContext] = createContext<CheckboxContext>({
  name: "CheckboxContext",
});
