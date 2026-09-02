import ComboBoxInputGroup from "./combo-box-input-group.vue";
import ComboBoxPopover from "./combo-box-popover.vue";
import ComboBoxRoot from "./combo-box-root.vue";
import ComboBoxTrigger from "./combo-box-trigger.vue";
import ComboBoxValue from "./combo-box-value.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ComboBox = Object.assign(ComboBoxRoot, {
  InputGroup: ComboBoxInputGroup,
  Popover: ComboBoxPopover,
  Root: ComboBoxRoot,
  Trigger: ComboBoxTrigger,
  Value: ComboBoxValue,
});

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export { ComboBoxInputGroup, ComboBoxPopover, ComboBoxRoot, ComboBoxTrigger, ComboBoxValue };

export type {
  ComboBoxInputGroupProps,
  ComboBoxInputGroupSlotProps,
  ComboBoxPopoverProps,
  ComboBoxRootEmits,
  ComboBoxRootProps,
  ComboBoxRootProps as ComboBoxProps,
  ComboBoxRootSlotProps,
  ComboBoxTriggerProps,
  ComboBoxValueProps,
  ComboBoxValueSlotProps,
} from "./combo-box.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { useComboBoxContext } from "./combo-box.context";

export type { ComboBoxContext } from "./combo-box.context";

/* -------------------------------------------------------------------------------------------------
 * Composables
 * -----------------------------------------------------------------------------------------------*/
export type { UseComboBoxReturn } from "../../composables/use-combo-box";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { comboBoxVariants } from "@ropav/styles";

export type { ComboBoxVariants } from "@ropav/styles";
