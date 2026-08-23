import CheckboxContent from "./checkbox-content.vue";
import CheckboxControl from "./checkbox-control.vue";
import CheckboxIndicator from "./checkbox-indicator.vue";
import CheckboxRoot from "./checkbox-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Checkbox = Object.assign(CheckboxRoot, {
  Content: CheckboxContent,
  Control: CheckboxControl,
  Indicator: CheckboxIndicator,
  Root: CheckboxRoot,
});

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
