import {
  DateInputGroupInput,
  DateInputGroupInputContainer,
  DateInputGroupPrefix,
  DateInputGroupRoot,
  DateInputGroupSegment,
  DateInputGroupSuffix,
} from "../date-input-group";

import DateRangePickerPopover from "./date-range-picker-popover.vue";
import DateRangePickerRangeSeparator from "./date-range-picker-range-separator.vue";
import DateRangePickerRoot from "./date-range-picker-root.vue";
import DateRangePickerTriggerIndicator from "./date-range-picker-trigger-indicator.vue";
import DateRangePickerTrigger from "./date-range-picker-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const DateRangePicker = Object.assign(DateRangePickerRoot, {
  Popover: DateRangePickerPopover,
  RangeSeparator: DateRangePickerRangeSeparator,
  Root: DateRangePickerRoot,
  Trigger: DateRangePickerTrigger,
  TriggerIndicator: DateRangePickerTriggerIndicator,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  DateRangePickerPopover,
  DateRangePickerRangeSeparator,
  DateRangePickerRoot,
  DateRangePickerTrigger,
  DateRangePickerTriggerIndicator,
};

/*
 * The segment parts live in `date-input-group`, which is internal, so they are re-exported here
 * under this picker's own names as well. A story template is compiled at runtime with no binding
 * metadata to resolve dot notation through, and the picker's markup needs them by name.
 */
export {
  DateInputGroupInput as DateRangePickerInput,
  DateInputGroupInputContainer as DateRangePickerInputContainer,
  DateInputGroupPrefix as DateRangePickerPrefix,
  DateInputGroupRoot as DateRangePickerGroup,
  DateInputGroupSegment as DateRangePickerSegment,
  DateInputGroupSuffix as DateRangePickerSuffix,
};

export type {
  DateRangePickerPopoverProps,
  DateRangePickerRangeSeparatorProps,
  DateRangePickerRootProps,
  DateRangePickerRootProps as DateRangePickerProps,
  DateRangePickerRootSlotProps,
  DateRangePickerTriggerIndicatorProps,
  DateRangePickerTriggerProps,
} from "./date-range-picker.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {
  provideDateRangePickerContext,
  useDateRangePickerContext,
} from "./date-range-picker.context";

export type {DateRangePickerContext} from "./date-range-picker.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {dateRangePickerVariants} from "@ropav/styles";

export type {DateRangePickerVariants} from "@ropav/styles";
