import MenuRoot from "./menu-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Menu = Object.assign(MenuRoot, { Root: MenuRoot });

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { MenuRoot };

export type { MenuRootEmits, MenuRootProps, MenuRootProps as MenuProps } from "./menu.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { useMenuContext, useMenuSectionContext } from "./menu.context";

export type { MenuContext, MenuSectionContext } from "./menu.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { menuVariants } from "@ropav/styles";

export type { MenuVariants } from "@ropav/styles";
