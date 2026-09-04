import SeparatorRoot from "./separator-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export { SeparatorRoot as Separator };

export type { SeparatorRootProps as SeparatorProps } from "./separator.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { useSeparatorContext } from "./separator.context";

export type { SeparatorContext } from "./separator.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { separatorVariants } from "@ropav/styles";

export type { SeparatorVariants } from "@ropav/styles";
