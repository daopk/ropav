import TextAreaRoot from "./textarea-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const TextArea = Object.assign(TextAreaRoot, {
  Root: TextAreaRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { TextAreaRoot };

export type { TextAreaRootProps, TextAreaRootProps as TextAreaProps } from "./textarea.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { textAreaVariants } from "@ropav/styles";

export type { TextAreaVariants } from "@ropav/styles";
