import {
  DateInputGroupInput,
  DateInputGroupInputContainer,
  DateInputGroupPrefix,
  DateInputGroupRoot,
  DateInputGroupSegment,
  DateInputGroupSuffix,
} from "../date-input-group";

import DatePickerPopover from "./date-picker-popover.vue";
import DatePickerRoot from "./date-picker-root.vue";
import DatePickerTriggerIndicator from "./date-picker-trigger-indicator.vue";
import DatePickerTrigger from "./date-picker-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  DatePickerPopover,
  DatePickerRoot as DatePicker,
  DatePickerTrigger,
  DatePickerTriggerIndicator,
};

/*
 * The segment parts live in `date-input-group`, which is internal, so they are re-exported here
 * under this picker's own names as well. A story template is compiled at runtime with no binding
 * metadata to resolve dot notation through, and the picker's markup needs them by name.
 */
export {
  DateInputGroupInput as DatePickerInput,
  DateInputGroupInputContainer as DatePickerInputContainer,
  DateInputGroupPrefix as DatePickerPrefix,
  DateInputGroupRoot as DatePickerGroup,
  DateInputGroupSegment as DatePickerSegment,
  DateInputGroupSuffix as DatePickerSuffix,
};

export type {
  DatePickerPopoverProps,
  DatePickerRootProps as DatePickerProps,
  DatePickerRootSlotProps as DatePickerSlotProps,
  DatePickerTriggerIndicatorProps,
  DatePickerTriggerProps,
} from "./date-picker.types";

export type {
  DateInputGroupInputContainerProps as DatePickerInputContainerProps,
  DateInputGroupInputProps as DatePickerInputProps,
  DateInputGroupInputSlotProps as DatePickerInputSlotProps,
  DateInputGroupPrefixProps as DatePickerPrefixProps,
  DateInputGroupRootProps as DatePickerGroupProps,
  DateInputGroupRootSlotProps as DatePickerGroupSlotProps,
  DateInputGroupSegmentProps as DatePickerSegmentProps,
  DateInputGroupSuffixProps as DatePickerSuffixProps,
} from "../date-input-group";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { provideDatePickerContext, useDatePickerContext } from "./date-picker.context";

export type { DatePickerContext } from "./date-picker.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { dateInputGroupVariants, datePickerVariants } from "@ropav/styles";

export type { DateInputGroupVariants, DatePickerVariants } from "@ropav/styles";
