import ChipLabel from "./chip-label.vue";
import ChipRoot from "./chip-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { ChipRoot as Chip, ChipLabel };

export type { ChipRootProps as ChipProps, ChipLabelProps } from "./chip.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { chipVariants } from "@ropav/styles";

export type { ChipVariants } from "@ropav/styles";
