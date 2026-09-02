import type { SplitterOrientation, SplitterState } from "./splitter.state";
import type { splitterVariants } from "@ropav/styles";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface SplitterContext {
  slots: ComputedRef<ReturnType<typeof splitterVariants>>;
  state: SplitterState;
  /** Handed down rather than re-read, so a nested splitter cannot inherit the outer axis. */
  orientation: ComputedRef<SplitterOrientation>;
  isDisabled: ComputedRef<boolean>;
  keyboardStep: ComputedRef<number>;
  keyboardLargeStep: ComputedRef<number>;
  /** The root element. The RTL check is read off it, and the measurement is taken from it. */
  rootEl: ComputedRef<HTMLElement | null>;
}

/*
 * Strict: a panel outside a splitter has nothing to register with and no size to take, and a
 * handle outside one would render a `separator` that controls nothing.
 */
export const [useSplitterContext, provideSplitterContext] = createContext<SplitterContext>({
  name: "SplitterContext",
});
