import SurfaceRoot from "./surface-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Surface = Object.assign(SurfaceRoot, {
  Root: SurfaceRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export { SurfaceRoot };

export type { SurfaceRootProps, SurfaceRootProps as SurfaceProps } from "./surface.types";

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
