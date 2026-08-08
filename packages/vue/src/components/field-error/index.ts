import FieldErrorContent from "./field-error-content.vue";
import FieldErrorRoot from "./field-error-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const FieldError = Object.assign(FieldErrorRoot, {
  Root: FieldErrorRoot,
  Content: FieldErrorContent,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

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
export {fieldErrorVariants} from "@heroui/styles";

export type {FieldErrorVariants} from "@heroui/styles";
