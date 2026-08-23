import SelectIndicator from "./select-indicator.vue";
import SelectPopover from "./select-popover.vue";
import SelectRoot from "./select-root.vue";
import SelectTrigger from "./select-trigger.vue";
import SelectValue from "./select-value.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Select = Object.assign(SelectRoot, {
  Indicator: SelectIndicator,
  Popover: SelectPopover,
  Root: SelectRoot,
  Trigger: SelectTrigger,
  Value: SelectValue,
});

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {SelectIndicator, SelectPopover, SelectRoot, SelectTrigger, SelectValue};

export type {
  SelectIndicatorProps,
  SelectPopoverProps,
  SelectRootProps,
  SelectRootProps as SelectProps,
  SelectRootSlotProps,
  SelectTriggerProps,
  SelectValueProps,
  SelectValueSlotProps,
} from "./select.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {useSelectContext} from "./select.context";

export type {SelectContext} from "./select.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {selectVariants} from "@heroui/styles";

export type {SelectVariants} from "@heroui/styles";
