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
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Part order mirrors the DOM order of a date picker, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const DatePicker = Object.assign(DatePickerRoot, {
  Root: DatePickerRoot,
  Trigger: DatePickerTrigger,
  TriggerIndicator: DatePickerTriggerIndicator,
  Popover: DatePickerPopover,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {DatePickerPopover, DatePickerRoot, DatePickerTrigger, DatePickerTriggerIndicator};

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
  DatePickerRootProps,
  DatePickerRootProps as DatePickerProps,
  DatePickerRootSlotProps,
  DatePickerTriggerIndicatorProps,
  DatePickerTriggerProps,
} from "./date-picker.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {provideDatePickerContext, useDatePickerContext} from "./date-picker.context";

export type {DatePickerContext} from "./date-picker.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {datePickerVariants} from "@heroui/styles";

export type {DatePickerVariants} from "@heroui/styles";
