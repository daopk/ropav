import MenuItemIndicator from "./menu-item-indicator.vue";
import MenuItemRoot from "./menu-item-root.vue";
import MenuItemSubmenuIndicator from "./menu-item-submenu-indicator.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const MenuItem = Object.assign(MenuItemRoot, {
  Indicator: MenuItemIndicator,
  Root: MenuItemRoot,
  SubmenuIndicator: MenuItemSubmenuIndicator,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {MenuItemIndicator, MenuItemRoot, MenuItemSubmenuIndicator};

export type {
  MenuItemIndicatorProps,
  MenuItemIndicatorSlotProps,
  MenuItemRootProps,
  MenuItemRootProps as MenuItemProps,
  MenuItemSlotProps,
  MenuItemSubmenuIndicatorProps,
} from "./menu-item.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {provideMenuItemPopupContext, useMenuItemContext} from "./menu-item.context";

export type {MenuItemContext, MenuItemPopupContext} from "./menu-item.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {menuItemVariants} from "@ropav/styles";

export type {MenuItemVariants} from "@ropav/styles";
