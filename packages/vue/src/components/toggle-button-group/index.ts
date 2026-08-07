import ToggleButtonGroupRoot from "./toggle-button-group-root.vue";
import ToggleButtonGroupSeparator from "./toggle-button-group-separator.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ToggleButtonGroup = Object.assign(ToggleButtonGroupRoot, {
  Root: ToggleButtonGroupRoot,
  Separator: ToggleButtonGroupSeparator,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {ToggleButtonGroupRoot, ToggleButtonGroupSeparator};

export type {
  ToggleButtonGroupRootProps,
  ToggleButtonGroupRootProps as ToggleButtonGroupProps,
  ToggleButtonGroupSeparatorProps,
} from "./toggle-button-group.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {useToggleButtonGroupContext} from "./toggle-button-group.context";

export type {ToggleButtonGroupContext} from "./toggle-button-group.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {toggleButtonGroupVariants} from "@heroui/styles";

export type {ToggleButtonGroupVariants} from "@heroui/styles";
