import ButtonRoot from "./button-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Button = Object.assign(ButtonRoot, {
  Root: ButtonRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {ButtonRoot};

export type {
  ButtonRootProps,
  ButtonRootProps as ButtonProps,
  ButtonSlotProps,
} from "./button.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {buttonVariants} from "@ropav/styles";

export type {ButtonVariants} from "@ropav/styles";
