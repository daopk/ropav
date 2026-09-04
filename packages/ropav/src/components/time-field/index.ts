import {
  DateInputGroupInput,
  DateInputGroupInputContainer,
  DateInputGroupPrefix,
  DateInputGroupRoot,
  DateInputGroupSegment,
  DateInputGroupSuffix,
} from "../date-input-group";

import TimeFieldRoot from "./time-field-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
/*
 * The parts live in `date-input-group`, which is internal, so they are re-exported here under this
 * field's own names, because a story template is compiled at runtime with no binding metadata to
 * resolve dot notation through.
 */
export {
  DateInputGroupInput as TimeFieldInput,
  DateInputGroupInputContainer as TimeFieldInputContainer,
  DateInputGroupPrefix as TimeFieldPrefix,
  DateInputGroupRoot as TimeFieldGroup,
  DateInputGroupSegment as TimeFieldSegment,
  DateInputGroupSuffix as TimeFieldSuffix,
};

export { TimeFieldRoot as TimeField };

export type {
  TimeFieldRootProps as TimeFieldProps,
  TimeFieldRootSlotProps as TimeFieldSlotProps,
} from "./time-field.types";

export type {
  DateInputGroupInputContainerProps as TimeFieldInputContainerProps,
  DateInputGroupInputProps as TimeFieldInputProps,
  DateInputGroupInputSlotProps as TimeFieldInputSlotProps,
  DateInputGroupPrefixProps as TimeFieldPrefixProps,
  DateInputGroupRootProps as TimeFieldGroupProps,
  DateInputGroupRootSlotProps as TimeFieldGroupSlotProps,
  DateInputGroupSegmentProps as TimeFieldSegmentProps,
  DateInputGroupSuffixProps as TimeFieldSuffixProps,
} from "../date-input-group";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { dateInputGroupVariants, timeFieldVariants } from "@ropav/styles";

export type { DateInputGroupVariants, TimeFieldVariants } from "@ropav/styles";
