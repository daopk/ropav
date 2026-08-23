import ErrorMessageRoot from "./error-message-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ErrorMessage = Object.assign(ErrorMessageRoot, {
  Root: ErrorMessageRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {ErrorMessageRoot};

export type {
  ErrorMessageRootProps,
  ErrorMessageRootProps as ErrorMessageProps,
} from "./error-message.types";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {errorMessageVariants} from "@heroui/styles";

export type {ErrorMessageVariants} from "@heroui/styles";
