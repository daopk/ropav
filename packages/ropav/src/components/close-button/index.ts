import CloseButtonRoot from "./close-button-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const CloseButton = Object.assign(CloseButtonRoot, {
  Root: CloseButtonRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {CloseButtonRoot};

export type {
  CloseButtonRootProps,
  CloseButtonRootProps as CloseButtonProps,
  CloseButtonSlotProps,
} from "./close-button.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {closeButtonVariants} from "@heroui/styles";

export type {CloseButtonVariants} from "@heroui/styles";
