import CheckboxGroupRoot from "./checkbox-group-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const CheckboxGroup = Object.assign(CheckboxGroupRoot, {
  Root: CheckboxGroupRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {CheckboxGroupRoot};

export type {
  CheckboxGroupRootProps,
  CheckboxGroupRootProps as CheckboxGroupProps,
  CheckboxGroupSlotProps,
} from "./checkbox-group.types";

export {useCheckboxGroupContext, provideCheckboxGroupContext} from "./checkbox-group.context";

export type {CheckboxGroupContext} from "./checkbox-group.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {checkboxGroupVariants} from "@heroui/styles";

export type {CheckboxGroupVariants} from "@heroui/styles";
