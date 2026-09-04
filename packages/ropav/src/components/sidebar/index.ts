import SidebarCollapsibleTrigger from "./sidebar-collapsible-trigger.vue";
import SidebarCollapsible from "./sidebar-collapsible.vue";
import SidebarContent from "./sidebar-content.vue";
import SidebarFooter from "./sidebar-footer.vue";
import SidebarGroupLabel from "./sidebar-group-label.vue";
import SidebarGroup from "./sidebar-group.vue";
import SidebarHeader from "./sidebar-header.vue";
import SidebarInset from "./sidebar-inset.vue";
import SidebarItemIcon from "./sidebar-item-icon.vue";
import SidebarItemIndicator from "./sidebar-item-indicator.vue";
import SidebarItemLabel from "./sidebar-item-label.vue";
import SidebarItemTooltip from "./sidebar-item-tooltip.vue";
import SidebarItemTrailing from "./sidebar-item-trailing.vue";
import SidebarItem from "./sidebar-item.vue";
import SidebarPanel from "./sidebar-panel.vue";
import SidebarRail from "./sidebar-rail.vue";
import SidebarRoot from "./sidebar-root.vue";
import SidebarSeparator from "./sidebar-separator.vue";
import SidebarSubMenu from "./sidebar-sub-menu.vue";
import SidebarTrigger from "./sidebar-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  SidebarRoot as Sidebar,
  SidebarPanel,
  SidebarInset,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarItem,
  SidebarItemIcon,
  SidebarItemLabel,
  SidebarItemTrailing,
  SidebarItemTooltip,
  SidebarRail,
  SidebarCollapsible,
  SidebarCollapsibleTrigger,
  SidebarItemIndicator,
  SidebarSubMenu,
};

export type {
  SidebarRootProps as SidebarProps,
  SidebarRootEmits as SidebarEmits,
  SidebarPanelProps,
  SidebarInsetProps,
  SidebarTriggerProps,
  SidebarHeaderProps,
  SidebarContentProps,
  SidebarFooterProps,
  SidebarGroupProps,
  SidebarGroupLabelProps,
  SidebarSeparatorProps,
  SidebarItemProps,
  SidebarItemEmits,
  SidebarItemIconProps,
  SidebarItemLabelProps,
  SidebarItemTrailingProps,
  SidebarItemTooltipProps,
  SidebarItemSlotProps,
  SidebarRailProps,
  SidebarRailSlotProps,
  SidebarCollapsibleProps,
  SidebarCollapsibleEmits,
  SidebarCollapsibleTriggerProps,
  SidebarCollapsibleSlotProps,
  SidebarCollapsibleTriggerSlotProps,
  SidebarItemIndicatorProps,
  SidebarSubMenuProps,
  SidebarSide,
  SidebarVariant,
  SidebarSlotProps,
  SidebarPartSlotProps,
  SidebarTriggerSlotProps,
} from "./sidebar.types";

/* -------------------------------------------------------------------------------------------------
 * State
 * -----------------------------------------------------------------------------------------------*/
export type { SidebarCollapsibleMode, SidebarState } from "./sidebar.state";

/* -------------------------------------------------------------------------------------------------
 * Borrowed Types
 * -----------------------------------------------------------------------------------------------*/
/* An item's `ariaCurrent` is a link's, down to the `"auto"` that asks the router. Re-exported here
 * rather than aliased, because it is the same type under the same name and a consumer reaching for
 * it through `ropav/sidebar` has to find it on this subpath. */
export type { LinkCurrent } from "../link/link.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {
  useSidebarCollapsibleContext,
  useSidebarContext,
  useSidebarGroupContext,
  useSidebarSubMenuContext,
} from "./sidebar.context";

export type {
  SidebarCollapsibleContext,
  SidebarContext,
  SidebarGroupContext,
} from "./sidebar.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { sidebarVariants } from "@ropav/styles";

export type { SidebarVariants } from "@ropav/styles";
