import CheckboxGroupRoot from "./checkbox-group-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export { CheckboxGroupRoot as CheckboxGroup };

export type {
  CheckboxGroupRootProps as CheckboxGroupProps,
  CheckboxGroupSlotProps,
} from "./checkbox-group.types";

export { useCheckboxGroupContext, provideCheckboxGroupContext } from "./checkbox-group.context";

export type { CheckboxGroupContext } from "./checkbox-group.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { checkboxGroupVariants } from "@ropav/styles";

export type { CheckboxGroupVariants } from "@ropav/styles";
