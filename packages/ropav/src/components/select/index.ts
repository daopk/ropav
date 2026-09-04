import SelectIndicator from "./select-indicator.vue";
import SelectPopover from "./select-popover.vue";
import SelectRoot from "./select-root.vue";
import SelectTrigger from "./select-trigger.vue";
import SelectValue from "./select-value.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export { SelectIndicator, SelectPopover, SelectRoot as Select, SelectTrigger, SelectValue };

export type {
  SelectIndicatorProps,
  SelectPopoverProps,
  SelectRootProps as SelectProps,
  SelectRootSlotProps as SelectSlotProps,
  SelectTriggerProps,
  SelectValueProps,
  SelectValueSlotProps,
} from "./select.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { useSelectContext } from "./select.context";

export type { SelectContext } from "./select.context";

/* -------------------------------------------------------------------------------------------------
 * Composables
 * -----------------------------------------------------------------------------------------------*/
export type { UseSelectReturn } from "../../composables/use-select";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { selectVariants } from "@ropav/styles";

export type { SelectVariants } from "@ropav/styles";
