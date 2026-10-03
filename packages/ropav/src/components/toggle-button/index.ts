import ToggleButtonRoot from "./toggle-button-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export { ToggleButtonRoot as ToggleButton };

export type {
  ToggleButtonRootProps as ToggleButtonProps,
  ToggleButtonSlotProps,
} from "./toggle-button.types";

/* -------------------------------------------------------------------------------------------------
 * Composables
 * -----------------------------------------------------------------------------------------------*/
export type { ToggleGroupKey } from "../../composables/use-toggle-group-state";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { toggleButtonVariants } from "@ropav/styles";

export type { ToggleButtonVariants } from "@ropav/styles";
