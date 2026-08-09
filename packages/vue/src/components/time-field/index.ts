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
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Part order mirrors the DOM order of a time field, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const TimeField = Object.assign(TimeFieldRoot, {
  Root: TimeFieldRoot,
  Group: DateInputGroupRoot,
  Input: DateInputGroupInput,
  InputContainer: DateInputGroupInputContainer,
  Segment: DateInputGroupSegment,
  Prefix: DateInputGroupPrefix,
  Suffix: DateInputGroupSuffix,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
/*
 * The parts live in `date-input-group`, which is internal, so they are re-exported here under this
 * field's own names — `@heroui/react` reaches them only through `TimeField.*`, and a story template
 * is compiled at runtime with no binding metadata to resolve dot notation through.
 */
export {
  DateInputGroupInput as TimeFieldInput,
  DateInputGroupInputContainer as TimeFieldInputContainer,
  DateInputGroupPrefix as TimeFieldPrefix,
  DateInputGroupRoot as TimeFieldGroup,
  DateInputGroupSegment as TimeFieldSegment,
  DateInputGroupSuffix as TimeFieldSuffix,
};

export {TimeFieldRoot};

export type {
  TimeFieldRootProps,
  TimeFieldRootProps as TimeFieldProps,
  TimeFieldRootSlotProps,
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
export {dateInputGroupVariants, timeFieldVariants} from "@heroui/styles";

export type {DateInputGroupVariants, TimeFieldVariants} from "@heroui/styles";
