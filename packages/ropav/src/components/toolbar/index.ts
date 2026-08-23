import ToolbarRoot from "./toolbar-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Toolbar = Object.assign(ToolbarRoot, {
  Root: ToolbarRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export { ToolbarRoot };

export type { ToolbarRootProps, ToolbarRootProps as ToolbarProps } from "./toolbar.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { useToolbarContext } from "./toolbar.context";

export type { ToolbarContext } from "./toolbar.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { toolbarVariants } from "@ropav/styles";

export type { ToolbarVariants } from "@ropav/styles";
