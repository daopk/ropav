import InputRoot from "./input-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Input = Object.assign(InputRoot, {
  Root: InputRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {InputRoot};

export type {InputRootProps, InputRootProps as InputProps} from "./input.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {inputVariants} from "@heroui/styles";

export type {InputVariants} from "@heroui/styles";
