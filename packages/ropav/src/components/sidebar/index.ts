import SidebarContent from "./sidebar-content.vue";
import SidebarFooter from "./sidebar-footer.vue";
import SidebarGroupLabel from "./sidebar-group-label.vue";
import SidebarGroup from "./sidebar-group.vue";
import SidebarHeader from "./sidebar-header.vue";
import SidebarInset from "./sidebar-inset.vue";
import SidebarItemIcon from "./sidebar-item-icon.vue";
import SidebarItemLabel from "./sidebar-item-label.vue";
import SidebarItemTrailing from "./sidebar-item-trailing.vue";
import SidebarItem from "./sidebar-item.vue";
import SidebarPanel from "./sidebar-panel.vue";
import SidebarRoot from "./sidebar-root.vue";
import SidebarSeparator from "./sidebar-separator.vue";
import SidebarTrigger from "./sidebar-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Sidebar = Object.assign(SidebarRoot, {
  Content: SidebarContent,
  Footer: SidebarFooter,
  Group: SidebarGroup,
  GroupLabel: SidebarGroupLabel,
  Header: SidebarHeader,
  Inset: SidebarInset,
  Item: SidebarItem,
  ItemIcon: SidebarItemIcon,
  ItemLabel: SidebarItemLabel,
  ItemTrailing: SidebarItemTrailing,
  Panel: SidebarPanel,
  Root: SidebarRoot,
  Separator: SidebarSeparator,
  Trigger: SidebarTrigger,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  SidebarRoot,
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
};

export type {
  SidebarRootProps,
  SidebarRootProps as SidebarProps,
  SidebarRootEmits,
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
  SidebarItemSlotProps,
  SidebarSide,
  SidebarSlotProps,
  SidebarPartSlotProps,
  SidebarTriggerSlotProps,
} from "./sidebar.types";

/* -------------------------------------------------------------------------------------------------
 * State
 * -----------------------------------------------------------------------------------------------*/
export type { SidebarCollapsible, SidebarState } from "./sidebar.state";

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
export { useSidebarContext, useSidebarGroupContext } from "./sidebar.context";

export type { SidebarContext, SidebarGroupContext } from "./sidebar.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { sidebarVariants } from "@ropav/styles";

export type { SidebarVariants } from "@ropav/styles";
