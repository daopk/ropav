import type {UseComboBoxReturn} from "../../composables/use-combo-box";
import type {UseComboBoxStateReturn} from "../../composables/use-combo-box-state";
import type {SelectedItem} from "../../composables/use-select-state";
import type {comboBoxVariants} from "@heroui/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface ComboBoxContext {
  /** The class for each part, from the shared variants. */
  slots: ComputedRef<ReturnType<typeof comboBoxVariants>>;
  state: UseComboBoxStateReturn<unknown>;
  comboBox: UseComboBoxReturn;
  selectedItems: ComputedRef<SelectedItem<unknown>[]>;
  /** The chosen options' text, joined the way the locale joins a list when several. */
  selectedText: ComputedRef<string>;
  isDisabled: ComputedRef<boolean>;
  /** The group around the field, which the popover is measured and positioned against. */
  setGroupElement: (element: HTMLElement | null) => void;
}

/**
 * Strict: every part of a combo box reads the state the root holds, so one rendered outside a root
 * would show a value nobody owns and a chevron that opens nothing.
 */
export const [useComboBoxContext, provideComboBoxContext] = createContext<ComboBoxContext>({
  name: "ComboBoxContext",
});
