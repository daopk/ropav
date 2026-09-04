import ToolbarRoot from "./toolbar-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export { ToolbarRoot as Toolbar };

export type { ToolbarRootProps as ToolbarProps } from "./toolbar.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { useToolbarContext } from "./toolbar.context";

export type { ToolbarContext } from "./toolbar.context";

/* -------------------------------------------------------------------------------------------------
 * Composables
 * -----------------------------------------------------------------------------------------------*/
export type { ToolbarOrientation } from "../../composables/use-toolbar";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { toolbarVariants } from "@ropav/styles";

export type { ToolbarVariants } from "@ropav/styles";
