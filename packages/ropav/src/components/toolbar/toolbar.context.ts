import type { ToolbarOrientation } from "../../composables/use-toolbar";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface ToolbarContext {
  /**
   * Axis the toolbar lays its controls out along. A group inside it follows the same axis
   * unless it names its own, so a vertical toolbar stacks its groups rather than leaving
   * them running across it.
   */
  orientation: ComputedRef<ToolbarOrientation>;
}

/**
 * Loose on purpose: a ButtonGroup or ToggleButtonGroup reads this context but is perfectly
 * usable on its own, so the absence of a toolbar is a normal state rather than an error.
 */
export const [useToolbarContext, provideToolbarContext] = createContext<ToolbarContext | null>({
  defaultValue: null,
  name: "ToolbarContext",
  strict: false,
});
