import FieldErrorContent from "./field-error-content.vue";
import FieldErrorRoot from "./field-error-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const FieldError = Object.assign(FieldErrorRoot, {
  Content: FieldErrorContent,
  Root: FieldErrorRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {FieldErrorRoot, FieldErrorContent};

export type {
  FieldErrorRootProps,
  FieldErrorRootProps as FieldErrorProps,
  FieldErrorContentProps,
  FieldErrorSlotProps,
} from "./field-error.types";

export {useFieldErrorContext, provideFieldErrorContext} from "./field-error.context";

export type {FieldErrorContext} from "./field-error.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {fieldErrorVariants} from "@ropav/styles";

export type {FieldErrorVariants} from "@ropav/styles";
