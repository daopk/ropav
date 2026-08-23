import type { UseListKeyboardReturn } from "../../composables/use-list-keyboard";
import type { UseTabListStateReturn } from "../../composables/use-tab-list-state";
import type { TabsKeyboardActivation, TabsOrientation } from "./tabs.types";
import type { tabsVariants } from "@ropav/styles";
import type { ComputedRef, ShallowRef } from "vue";

import { createContext } from "../../utils/create-context";

export interface TabsContext {
  slots: ComputedRef<ReturnType<typeof tabsVariants>>;
  orientation: ComputedRef<TabsOrientation>;
  keyboardActivation: ComputedRef<TabsKeyboardActivation>;
  isDisabled: ComputedRef<boolean>;
  /** Which tab is selected, the collection it is selected from, and the ids tying tab to panel. */
  state: UseTabListStateReturn;
  keyboard: UseListKeyboardReturn;
  /**
   * The element carrying `role="tablist"`.
   *
   * Owned by the root, because the keyboard and the collection are — but rendered by the list,
   * so the list is what fills it in.
   */
  listElement: ShallowRef<HTMLElement | null>;
}

export const [useTabsContext, provideTabsContext] = createContext<TabsContext>({
  name: "TabsContext",
});

export interface TabsTabContext {
  /** Read by the indicator, which is rendered inside the tab it belongs to. */
  isSelected: ComputedRef<boolean>;
}

export const [useTabsTabContext, provideTabsTabContext] = createContext<TabsTabContext>({
  name: "TabsTabContext",
});
