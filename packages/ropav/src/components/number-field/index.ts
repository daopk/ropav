import NumberFieldDecrementButton from "./number-field-decrement-button.vue";
import NumberFieldGroup from "./number-field-group.vue";
import NumberFieldIncrementButton from "./number-field-increment-button.vue";
import NumberFieldInput from "./number-field-input.vue";
import NumberFieldRoot from "./number-field-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const NumberField = Object.assign(NumberFieldRoot, {
  DecrementButton: NumberFieldDecrementButton,
  Group: NumberFieldGroup,
  IncrementButton: NumberFieldIncrementButton,
  Input: NumberFieldInput,
  Root: NumberFieldRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  NumberFieldDecrementButton,
  NumberFieldGroup,
  NumberFieldIncrementButton,
  NumberFieldInput,
  NumberFieldRoot,
};

export type {
  NumberFieldRootProps,
  NumberFieldRootProps as NumberFieldProps,
  NumberFieldRootSlotProps,
  NumberFieldGroupProps,
  NumberFieldGroupSlotProps,
  NumberFieldInputProps,
  NumberFieldStepperButtonProps,
} from "./number-field.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {provideNumberFieldContext, useNumberFieldContext} from "./number-field.context";

export type {NumberFieldContext} from "./number-field.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {numberFieldVariants} from "@ropav/styles";

export type {NumberFieldVariants} from "@ropav/styles";
