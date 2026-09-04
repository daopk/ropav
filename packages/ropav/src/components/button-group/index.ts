import ButtonGroupRoot from "./button-group-root.vue";
import ButtonGroupSeparator from "./button-group-separator.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { ButtonGroupRoot as ButtonGroup, ButtonGroupSeparator };

export type {
  ButtonGroupRootProps as ButtonGroupProps,
  ButtonGroupSeparatorProps,
} from "./button-group.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { useButtonGroupContext } from "./button-group.context";

export type { ButtonGroupContext } from "./button-group.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { buttonGroupVariants } from "@ropav/styles";

export type { ButtonGroupVariants } from "@ropav/styles";
