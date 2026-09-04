import {
  DateInputGroupInput,
  DateInputGroupInputContainer,
  DateInputGroupPrefix,
  DateInputGroupRoot,
  DateInputGroupSegment,
  DateInputGroupSuffix,
} from "../date-input-group";

import DateFieldRoot from "./date-field-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
/*
 * The parts live in `date-input-group`, which is internal, so they are re-exported here under this
 * field's own names, because a story template is compiled at runtime with no binding metadata to
 * resolve dot notation through.
 */
export {
  DateInputGroupInput as DateFieldInput,
  DateInputGroupInputContainer as DateFieldInputContainer,
  DateInputGroupPrefix as DateFieldPrefix,
  DateInputGroupRoot as DateFieldGroup,
  DateInputGroupSegment as DateFieldSegment,
  DateInputGroupSuffix as DateFieldSuffix,
};

export { DateFieldRoot as DateField };

export type {
  DateFieldRootProps as DateFieldProps,
  DateFieldRootSlotProps as DateFieldSlotProps,
} from "./date-field.types";

export type {
  DateInputGroupInputContainerProps as DateFieldInputContainerProps,
  DateInputGroupInputProps as DateFieldInputProps,
  DateInputGroupInputSlotProps as DateFieldInputSlotProps,
  DateInputGroupPrefixProps as DateFieldPrefixProps,
  DateInputGroupRootProps as DateFieldGroupProps,
  DateInputGroupRootSlotProps as DateFieldGroupSlotProps,
  DateInputGroupSegmentProps as DateFieldSegmentProps,
  DateInputGroupSuffixProps as DateFieldSuffixProps,
} from "../date-input-group";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { dateFieldVariants, dateInputGroupVariants } from "@ropav/styles";

export type { DateFieldVariants, DateInputGroupVariants } from "@ropav/styles";
