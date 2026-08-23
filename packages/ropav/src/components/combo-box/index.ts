import ComboBoxInputGroup from "./combo-box-input-group.vue";
import ComboBoxPopover from "./combo-box-popover.vue";
import ComboBoxRoot from "./combo-box-root.vue";
import ComboBoxTrigger from "./combo-box-trigger.vue";
import ComboBoxValue from "./combo-box-value.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
// Ordered the way the parts appear in the DOM, which is easier to read against the markup than
// alphabetical order would be.
export const ComboBox = Object.assign(ComboBoxRoot, {
  Root: ComboBoxRoot,
  InputGroup: ComboBoxInputGroup,
  Trigger: ComboBoxTrigger,
  Value: ComboBoxValue,
  Popover: ComboBoxPopover,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {ComboBoxInputGroup, ComboBoxPopover, ComboBoxRoot, ComboBoxTrigger, ComboBoxValue};

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
export {useComboBoxContext} from "./combo-box.context";

export type {ComboBoxContext} from "./combo-box.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {comboBoxVariants} from "@ropav/styles";

export type {ComboBoxVariants} from "@ropav/styles";
