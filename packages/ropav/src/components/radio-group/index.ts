import RadioGroupRoot from "./radio-group-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export { RadioGroupRoot as RadioGroup };

export type {
  RadioGroupRootProps as RadioGroupProps,
  RadioGroupSlotProps,
} from "./radio-group.types";

export { useRadioGroupContext, provideRadioGroupContext } from "./radio-group.context";

export type { RadioGroupContext } from "./radio-group.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { radioGroupVariants } from "@ropav/styles";

export type { RadioGroupVariants } from "@ropav/styles";
