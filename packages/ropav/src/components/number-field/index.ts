import NumberFieldDecrementButton from "./number-field-decrement-button.vue";
import NumberFieldGroup from "./number-field-group.vue";
import NumberFieldIncrementButton from "./number-field-increment-button.vue";
import NumberFieldInput from "./number-field-input.vue";
import NumberFieldRoot from "./number-field-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  NumberFieldDecrementButton,
  NumberFieldGroup,
  NumberFieldIncrementButton,
  NumberFieldInput,
  NumberFieldRoot as NumberField,
};

export type {
  NumberFieldRootProps as NumberFieldProps,
  NumberFieldRootSlotProps as NumberFieldSlotProps,
  NumberFieldGroupProps,
  NumberFieldGroupSlotProps,
  NumberFieldInputProps,
  NumberFieldStepperButtonProps,
} from "./number-field.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { provideNumberFieldContext, useNumberFieldContext } from "./number-field.context";

export type { NumberFieldContext } from "./number-field.context";

/* -------------------------------------------------------------------------------------------------
 * Composables
 * -----------------------------------------------------------------------------------------------*/
export type { NumberFieldStepper, UseNumberFieldReturn } from "../../composables/use-number-field";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { numberFieldVariants } from "@ropav/styles";

export type { NumberFieldVariants } from "@ropav/styles";
