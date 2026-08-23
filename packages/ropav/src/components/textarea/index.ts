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
export {TextAreaRoot};

export type {TextAreaRootProps, TextAreaRootProps as TextAreaProps} from "./textarea.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {textAreaVariants} from "@heroui/styles";

export type {TextAreaVariants} from "@heroui/styles";
