import RadioGroupRoot from "./radio-group-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const RadioGroup = Object.assign(RadioGroupRoot, {
  Root: RadioGroupRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {RadioGroupRoot};

export type {
  RadioGroupRootProps,
  RadioGroupRootProps as RadioGroupProps,
  RadioGroupSlotProps,
} from "./radio-group.types";

export {useRadioGroupContext, provideRadioGroupContext} from "./radio-group.context";

export type {RadioGroupContext} from "./radio-group.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {radioGroupVariants} from "@heroui/styles";

export type {RadioGroupVariants} from "@heroui/styles";
