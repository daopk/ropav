import ToggleButtonGroupRoot from "./toggle-button-group-root.vue";
import ToggleButtonGroupSeparator from "./toggle-button-group-separator.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { ToggleButtonGroupRoot as ToggleButtonGroup, ToggleButtonGroupSeparator };

export type {
  ToggleButtonGroupRootProps as ToggleButtonGroupProps,
  ToggleButtonGroupSeparatorProps,
} from "./toggle-button-group.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { useToggleButtonGroupContext } from "./toggle-button-group.context";

export type { ToggleButtonGroupContext } from "./toggle-button-group.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { toggleButtonGroupVariants } from "@ropav/styles";

export type { ToggleButtonGroupVariants } from "@ropav/styles";
