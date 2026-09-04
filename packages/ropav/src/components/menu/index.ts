import MenuRoot from "./menu-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { MenuRoot as Menu };

export type { MenuRootEmits as MenuEmits, MenuRootProps as MenuProps } from "./menu.types";

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
