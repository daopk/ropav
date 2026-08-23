import TextFieldRoot from "./textfield-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const TextField = Object.assign(TextFieldRoot, {
  Root: TextFieldRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {TextFieldRoot};

export type {
  TextFieldRootProps,
  TextFieldRootProps as TextFieldProps,
  TextFieldSlotProps,
} from "./textfield.types";

export {useTextFieldContext, provideTextFieldContext} from "./textfield.context";

export type {TextFieldContext} from "./textfield.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {textFieldVariants} from "@ropav/styles";

export type {TextFieldVariants} from "@ropav/styles";
