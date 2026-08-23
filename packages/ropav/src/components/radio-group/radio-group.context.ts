import type { RadioGroupState } from "../../composables/use-radio-group-state";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface RadioGroupContext {
  /** Selection and validation shared by every radio in the group. */
  state: RadioGroupState;
  /** `id` of the form the radios submit with. */
  form: ComputedRef<string | undefined>;
  /**
   * The group's own help text for each radio to point at: its error message while the group
   * is invalid, then its description. A radio has no validity of its own — the group holds it.
   */
  describedBy: ComputedRef<string | undefined>;
}

/** Strict: a radio outside a group has no name to share and no selection to belong to. */
export const [useRadioGroupContext, provideRadioGroupContext] = createContext<RadioGroupContext>({
  errorMessage:
    "Radio must be used inside a RadioGroup: a radio takes its name, selection and validity from the group.",
  name: "RadioGroupContext",
});
