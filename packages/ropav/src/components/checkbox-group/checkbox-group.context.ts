import type {CheckboxGroupState} from "../../composables/use-checkbox-group-state";
import type {CheckboxVariants} from "@ropav/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface CheckboxGroupContext {
  /** Selection and validation shared by every checkbox in the group. */
  state: CheckboxGroupState;
  /** Variant an item takes when it names none of its own. */
  variant: ComputedRef<CheckboxVariants["variant"]>;
  /** Name every item submits under, unless it overrides it. */
  name: ComputedRef<string | undefined>;
  /** `id` of the form the items submit with. */
  form: ComputedRef<string | undefined>;
  /**
   * The group's own help text for each item to point at: its error message while the group
   * is invalid, then its description. Validation belongs to the group, so this is how an
   * item's accessible description reaches it.
   */
  describedBy: ComputedRef<string | undefined>;
}

/**
 * Loose: a checkbox on its own is the normal case, and reading `null` here is exactly how a
 * `Checkbox` knows to own its state rather than defer to a group.
 */
export const [useCheckboxGroupContext, provideCheckboxGroupContext] =
  createContext<CheckboxGroupContext | null>({
    defaultValue: null,
    name: "CheckboxGroupContext",
    strict: false,
  });
