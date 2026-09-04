import TextFieldRoot from "./textfield-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { TextFieldRoot as TextField };

export type { TextFieldRootProps as TextFieldProps, TextFieldSlotProps } from "./textfield.types";

export { useTextFieldContext, provideTextFieldContext } from "./textfield.context";

export type { TextFieldContext } from "./textfield.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { textFieldVariants } from "@ropav/styles";

export type { TextFieldVariants } from "@ropav/styles";
