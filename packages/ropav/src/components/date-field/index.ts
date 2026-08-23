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
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Part order mirrors the DOM order of a date field, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const DateField = Object.assign(DateFieldRoot, {
  Root: DateFieldRoot,
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
 * field's own names — `@heroui/react` reaches them only through `DateField.*`, and a story template
 * is compiled at runtime with no binding metadata to resolve dot notation through.
 */
export {
  DateInputGroupInput as DateFieldInput,
  DateInputGroupInputContainer as DateFieldInputContainer,
  DateInputGroupPrefix as DateFieldPrefix,
  DateInputGroupRoot as DateFieldGroup,
  DateInputGroupSegment as DateFieldSegment,
  DateInputGroupSuffix as DateFieldSuffix,
};

export {DateFieldRoot};

export type {
  DateFieldRootProps,
  DateFieldRootProps as DateFieldProps,
  DateFieldRootSlotProps,
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
export {dateFieldVariants, dateInputGroupVariants} from "@ropav/styles";

export type {DateFieldVariants, DateInputGroupVariants} from "@ropav/styles";
