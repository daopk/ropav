import ChipLabel from "./chip-label.vue";
import ChipRoot from "./chip-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Chip = Object.assign(ChipRoot, {
  Label: ChipLabel,
  Root: ChipRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { ChipRoot, ChipLabel };

export type { ChipRootProps, ChipRootProps as ChipProps, ChipLabelProps } from "./chip.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { chipVariants } from "@ropav/styles";

export type { ChipVariants } from "@ropav/styles";
