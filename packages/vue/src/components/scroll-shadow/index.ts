import ScrollShadowRoot from "./scroll-shadow-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ScrollShadow = Object.assign(ScrollShadowRoot, {Root: ScrollShadowRoot});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {ScrollShadowRoot};

export type {
  ScrollShadowRootProps,
  ScrollShadowRootProps as ScrollShadowProps,
  ScrollShadowVisibility,
} from "./scroll-shadow.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {scrollShadowVariants} from "@heroui/styles";

export type {ScrollShadowVariants} from "@heroui/styles";

/* -------------------------------------------------------------------------------------------------
 * Composable
 * -----------------------------------------------------------------------------------------------*/
export {useScrollShadow} from "./use-scroll-shadow";

export type {UseScrollShadowProps, UseScrollShadowReturn} from "./use-scroll-shadow";
