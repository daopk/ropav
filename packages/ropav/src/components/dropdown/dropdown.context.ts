import type { RootMenuTriggerState } from "../../composables/use-overlay-trigger-state";
import type { OverlayTargetContext } from "../overlay";
import type { dropdownVariants } from "@ropav/styles";
import type { ComputedRef } from "vue";

import { createContext } from "../../utils/create-context";
import { provideOverlayTargetContext, useOverlayTargetContext } from "../overlay";

export interface DropdownContext {
  /**
   * The whole tree's open state, held on the root.
   *
   * A submenu asks it whether its own trigger is the one expanded at its level rather than holding
   * a flag of its own, which is what keeps a single path through the tree open.
   */
  state: RootMenuTriggerState;
  slots: ComputedRef<ReturnType<typeof dropdownVariants>>;
}

/** Strict: every part of a dropdown needs the state the root holds. */
export const [useDropdownContext, provideDropdownContext] = createContext<DropdownContext>({
  name: "DropdownContext",
});

/**
 * What one popover in the tree is for: which trigger opened it, where it goes, and what it names.
 *
 * The shared overlay context under another name. Provided by the dropdown root for the outermost
 * popover and overridden by each submenu trigger, so a popover reads its own role from whatever is
 * nearest above it and needs to know nothing about how deep it sits.
 */
export type DropdownPopoverTarget = OverlayTargetContext;

export const useDropdownPopoverTarget = useOverlayTargetContext;
export const provideDropdownPopoverTarget = provideOverlayTargetContext;
