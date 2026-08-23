import ButtonGroupRoot from "./button-group-root.vue";
import ButtonGroupSeparator from "./button-group-separator.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ButtonGroup = Object.assign(ButtonGroupRoot, {
  Root: ButtonGroupRoot,
  Separator: ButtonGroupSeparator,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {ButtonGroupRoot, ButtonGroupSeparator};

export type {
  ButtonGroupRootProps,
  ButtonGroupRootProps as ButtonGroupProps,
  ButtonGroupSeparatorProps,
} from "./button-group.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {useButtonGroupContext} from "./button-group.context";

export type {ButtonGroupContext} from "./button-group.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {buttonGroupVariants} from "@ropav/styles";

export type {ButtonGroupVariants} from "@ropav/styles";
