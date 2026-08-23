import type { FormValidationState } from "../../composables/use-form-validation-state";
import type { switchVariants } from "@ropav/styles";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface SwitchContext {
  slots: ComputedRef<ReturnType<typeof switchVariants>>;
  isSelected: ComputedRef<boolean>;
  isDisabled: ComputedRef<boolean>;
  isReadOnly: ComputedRef<boolean>;
  /** What validation currently says, after the behaviour has decided to reveal it. */
  isInvalid: ComputedRef<boolean>;
  isRequired: ComputedRef<boolean>;
  /** The field's validation, for the hidden input to wire the browser up to. */
  validation: FormValidationState;
  /** Value the hidden input goes back to when the surrounding form is reset. */
  defaultSelected: ComputedRef<boolean>;
  /** Ids of the description and error message the field renders, plus the caller's own. */
  describedBy: ComputedRef<string | undefined>;
  id: ComputedRef<string | undefined>;
  ariaLabel: ComputedRef<string | undefined>;
  ariaLabelledby: ComputedRef<string | undefined>;
  name: ComputedRef<string | undefined>;
  value: ComputedRef<string | undefined>;
  form: ComputedRef<string | undefined>;
  setSelected: (isSelected: boolean) => void;
}

export const [useSwitchContext, provideSwitchContext] = createContext<SwitchContext>({
  name: "SwitchContext",
});
