import ScrollShadowRoot from "./scroll-shadow-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { ScrollShadowRoot as ScrollShadow };

export type {
  ScrollShadowRootProps as ScrollShadowProps,
  ScrollShadowVisibility,
} from "./scroll-shadow.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { scrollShadowVariants } from "@ropav/styles";

export type { ScrollShadowVariants } from "@ropav/styles";

/* -------------------------------------------------------------------------------------------------
 * Composable
 * -----------------------------------------------------------------------------------------------*/
export { useScrollShadow } from "./use-scroll-shadow";

export type { UseScrollShadowProps, UseScrollShadowReturn } from "./use-scroll-shadow";
