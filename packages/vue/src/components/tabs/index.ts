import TabsIndicator from "./tabs-indicator.vue";
import TabsListContainer from "./tabs-list-container.vue";
import TabsList from "./tabs-list.vue";
import TabsPanel from "./tabs-panel.vue";
import TabsRoot from "./tabs-root.vue";
import TabsSeparator from "./tabs-separator.vue";
import TabsTab from "./tabs-tab.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Part order mirrors the DOM order of a set of tabs, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const Tabs = Object.assign(TabsRoot, {
  Root: TabsRoot,
  ListContainer: TabsListContainer,
  List: TabsList,
  Tab: TabsTab,
  Indicator: TabsIndicator,
  Separator: TabsSeparator,
  Panel: TabsPanel,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {TabsRoot, TabsListContainer, TabsList, TabsTab, TabsIndicator, TabsSeparator, TabsPanel};

export type {
  TabsRootProps,
  TabsRootProps as TabsProps,
  TabsRootSlotProps,
  TabsListContainerProps,
  TabsListProps,
  TabsTabProps,
  TabsTabSlotProps,
  TabsIndicatorProps,
  TabsSeparatorProps,
  TabsPanelProps,
  TabsPanelSlotProps,
  TabsKeyboardActivation,
  TabsOrientation,
} from "./tabs.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {useTabsContext, useTabsTabContext} from "./tabs.context";

export type {TabsContext, TabsTabContext} from "./tabs.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {tabsVariants} from "@heroui/styles";

export type {TabsVariants} from "@heroui/styles";
