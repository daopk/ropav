import CheckboxContent from "./checkbox-content.vue";
import CheckboxControl from "./checkbox-control.vue";
import CheckboxIndicator from "./checkbox-indicator.vue";
import CheckboxRoot from "./checkbox-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const Checkbox = Object.assign(CheckboxRoot, {
  Root: CheckboxRoot,
  Content: CheckboxContent,
  Control: CheckboxControl,
  Indicator: CheckboxIndicator,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {CheckboxRoot, CheckboxContent, CheckboxControl, CheckboxIndicator};

export type {
  CheckboxRootProps,
  CheckboxRootProps as CheckboxProps,
  CheckboxContentProps,
  CheckboxControlProps,
  CheckboxIndicatorProps,
  CheckboxSlotProps,
  CheckboxContentSlotProps,
} from "./checkbox.types";

export {useCheckboxContext, provideCheckboxContext} from "./checkbox.context";

export type {CheckboxContext} from "./checkbox.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {checkboxVariants} from "@ropav/styles";

export type {CheckboxVariants} from "@ropav/styles";
