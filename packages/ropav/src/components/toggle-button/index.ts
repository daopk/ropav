import ToggleButtonRoot from "./toggle-button-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ToggleButton = Object.assign(ToggleButtonRoot, {
  Root: ToggleButtonRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export { ToggleButtonRoot };

export type {
  ToggleButtonRootProps,
  ToggleButtonRootProps as ToggleButtonProps,
  ToggleButtonSlotProps,
} from "./toggle-button.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { toggleButtonVariants } from "@ropav/styles";

export type { ToggleButtonVariants } from "@ropav/styles";
