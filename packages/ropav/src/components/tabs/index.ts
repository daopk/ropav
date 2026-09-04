import TabsIndicator from "./tabs-indicator.vue";
import TabsListContainer from "./tabs-list-container.vue";
import TabsList from "./tabs-list.vue";
import TabsPanel from "./tabs-panel.vue";
import TabsRoot from "./tabs-root.vue";
import TabsSeparator from "./tabs-separator.vue";
import TabsTab from "./tabs-tab.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  TabsRoot as Tabs,
  TabsListContainer,
  TabsList,
  TabsTab,
  TabsIndicator,
  TabsSeparator,
  TabsPanel,
};

export type {
  TabsRootProps as TabsProps,
  TabsRootSlotProps as TabsSlotProps,
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
export { useTabsContext, useTabsTabContext } from "./tabs.context";

export type { TabsContext, TabsTabContext } from "./tabs.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { tabsVariants } from "@ropav/styles";

export type { TabsVariants } from "@ropav/styles";
