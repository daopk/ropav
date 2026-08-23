import SeparatorRoot from "./separator-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Separator = Object.assign(SeparatorRoot, {
  Root: SeparatorRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {SeparatorRoot};

export type {SeparatorRootProps, SeparatorRootProps as SeparatorProps} from "./separator.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {useSeparatorContext} from "./separator.context";

export type {SeparatorContext} from "./separator.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {separatorVariants} from "@heroui/styles";

export type {SeparatorVariants} from "@heroui/styles";
