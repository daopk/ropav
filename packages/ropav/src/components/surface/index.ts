import SurfaceRoot from "./surface-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export { SurfaceRoot as Surface };

export type { SurfaceRootProps as SurfaceProps } from "./surface.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { provideSurfaceContext, useSurfaceContext } from "./surface.context";

export type { SurfaceContext } from "./surface.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { surfaceVariants } from "@ropav/styles";

export type { SurfaceVariants } from "@ropav/styles";
