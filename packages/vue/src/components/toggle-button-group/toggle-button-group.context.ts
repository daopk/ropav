import type {UseToggleGroupStateReturn} from "../../composables/use-toggle-group-state";
import type {ToggleButtonVariants, toggleButtonGroupVariants} from "@heroui/styles";
import type {ComputedRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface ToggleButtonGroupContext {
  slots: ComputedRef<ReturnType<typeof toggleButtonGroupVariants>>;
  size: ComputedRef<ToggleButtonVariants["size"]>;
  /**
   * Selection state for the whole group. A ToggleButton inside the group defers to this
   * instead of holding its own on/off state, which is what lets single-selection mode
   * turn one button off as another comes on.
   */
  state: UseToggleGroupStateReturn;
}

/**
 * Loose on purpose: a ToggleButton reads this context but works standalone too, where it
 * keeps its own selected state. The absence of a group is a normal state, not an error.
 */
export const [useToggleButtonGroupContext, provideToggleButtonGroupContext] =
  createContext<ToggleButtonGroupContext | null>({
    defaultValue: null,
    name: "ToggleButtonGroupContext",
    strict: false,
  });
