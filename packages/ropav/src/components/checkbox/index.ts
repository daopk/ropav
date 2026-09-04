import CheckboxContent from "./checkbox-content.vue";
import CheckboxControl from "./checkbox-control.vue";
import CheckboxIndicator from "./checkbox-indicator.vue";
import CheckboxRoot from "./checkbox-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { CheckboxRoot as Checkbox, CheckboxContent, CheckboxControl, CheckboxIndicator };

export type {
  CheckboxRootProps as CheckboxProps,
  CheckboxContentProps,
  CheckboxControlProps,
  CheckboxIndicatorProps,
  CheckboxSlotProps,
  CheckboxContentSlotProps,
} from "./checkbox.types";

export { useCheckboxContext, provideCheckboxContext } from "./checkbox.context";

export type { CheckboxContext } from "./checkbox.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { checkboxVariants } from "@ropav/styles";

export type { CheckboxVariants } from "@ropav/styles";
