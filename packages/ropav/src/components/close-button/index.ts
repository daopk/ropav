import CloseButtonRoot from "./close-button-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export { CloseButtonRoot as CloseButton };

export type {
  CloseButtonRootProps as CloseButtonProps,
  CloseButtonSlotProps,
} from "./close-button.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { closeButtonVariants } from "@ropav/styles";

export type { CloseButtonVariants } from "@ropav/styles";
