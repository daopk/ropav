import ComboBoxInputGroup from "./combo-box-input-group.vue";
import ComboBoxPopover from "./combo-box-popover.vue";
import ComboBoxRoot from "./combo-box-root.vue";
import ComboBoxTrigger from "./combo-box-trigger.vue";
import ComboBoxValue from "./combo-box-value.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {
  ComboBoxInputGroup,
  ComboBoxPopover,
  ComboBoxRoot as ComboBox,
  ComboBoxTrigger,
  ComboBoxValue,
};

export type {
  ComboBoxInputGroupProps,
  ComboBoxInputGroupSlotProps,
  ComboBoxPopoverProps,
  ComboBoxRootEmits as ComboBoxEmits,
  ComboBoxRootProps as ComboBoxProps,
  ComboBoxRootSlotProps as ComboBoxSlotProps,
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
