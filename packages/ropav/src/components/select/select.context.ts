import type {UseSelectReturn} from "../../composables/use-select";
import type {SelectedItem, UseSelectStateReturn} from "../../composables/use-select-state";
import type {selectVariants} from "@ropav/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface SelectContext {
  slots: ComputedRef<ReturnType<typeof selectVariants>>;
  state: UseSelectStateReturn<unknown>;
  select: UseSelectReturn;
  /** The chosen options, with the datum each was built from. */
  selectedItems: ComputedRef<SelectedItem<unknown>[]>;
  /** The chosen options' text, joined the way the locale joins a list when several. */
  selectedText: ComputedRef<string>;
  /** What the trigger shows when nothing is chosen, already resolved to the localized default. */
  placeholder: ComputedRef<string>;
}

/**
 * Strict: every part of a select reads the state the root holds, so one rendered outside a root
 * would show a value nobody owns and a trigger that opens nothing.
 */
export const [useSelectContext, provideSelectContext] = createContext<SelectContext>({
  name: "SelectContext",
});
