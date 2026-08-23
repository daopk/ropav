import type { UseDisclosureGroupReturn } from "../../composables/use-disclosure-group";

import { createContext } from "../../utils/create-context";

export interface DisclosureGroupContext {
  /**
   * Expanded-key state and trigger keyboard navigation for the whole group. A Disclosure
   * inside the group defers to this instead of holding its own expanded state, which is what
   * lets single-expansion mode close one panel as another opens.
   */
  group: UseDisclosureGroupReturn;
}

/**
 * Loose on purpose: a Disclosure reads this context but works standalone too, where it keeps
 * its own expanded state. The absence of a group is a normal state, not an error.
 */
export const [useDisclosureGroupContext, provideDisclosureGroupContext] =
  createContext<DisclosureGroupContext | null>({
    defaultValue: null,
    name: "DisclosureGroupContext",
    strict: false,
  });
