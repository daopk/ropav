import FieldErrorContent from "./field-error-content.vue";
import FieldErrorRoot from "./field-error-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { FieldErrorRoot as FieldError, FieldErrorContent };

export type {
  FieldErrorRootProps as FieldErrorProps,
  FieldErrorContentProps,
  FieldErrorSlotProps,
} from "./field-error.types";

export { useFieldErrorContext, provideFieldErrorContext } from "./field-error.context";

export type { FieldErrorContext } from "./field-error.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { fieldErrorVariants } from "@ropav/styles";

export type { FieldErrorVariants } from "@ropav/styles";
