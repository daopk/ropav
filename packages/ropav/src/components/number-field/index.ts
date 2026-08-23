import NumberFieldDecrementButton from "./number-field-decrement-button.vue";
import NumberFieldGroup from "./number-field-group.vue";
import NumberFieldIncrementButton from "./number-field-increment-button.vue";
import NumberFieldInput from "./number-field-input.vue";
import NumberFieldRoot from "./number-field-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Part order mirrors the DOM order of a number field, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const NumberField = Object.assign(NumberFieldRoot, {
  Root: NumberFieldRoot,
  Group: NumberFieldGroup,
  DecrementButton: NumberFieldDecrementButton,
  Input: NumberFieldInput,
  IncrementButton: NumberFieldIncrementButton,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

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
