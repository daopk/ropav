import DateInputGroupInputContainer from "./date-input-group-input-container.vue";
import DateInputGroupInput from "./date-input-group-input.vue";
import DateInputGroupPrefix from "./date-input-group-prefix.vue";
import DateInputGroupRoot from "./date-input-group-root.vue";
import DateInputGroupSegment from "./date-input-group-segment.vue";
import DateInputGroupSuffix from "./date-input-group-suffix.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
/*
 * Not a compound component and not a package entry point: `DateField` and `TimeField` re-export
 * these parts under their own names. Nothing imports this directory from outside the package.
 */
export {
  DateInputGroupInput,
  DateInputGroupInputContainer,
  DateInputGroupPrefix,
  DateInputGroupRoot,
  DateInputGroupSegment,
  DateInputGroupSuffix,
};

export type {
  DateInputGroupInputContainerProps,
  DateInputGroupInputProps,
  DateInputGroupInputSlotProps,
  DateInputGroupPrefixProps,
  DateInputGroupRootProps,
  DateInputGroupRootSlotProps,
  DateInputGroupSegmentProps,
  DateInputGroupSuffixProps,
} from "./date-input-group.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {
  provideDateFieldControlContext,
  provideDateInputGroupContext,
  provideDateInputGroupOwnerContext,
  useDateFieldControlContext,
  useDateInputGroupContext,
  useDateInputGroupOwnerContext,
} from "./date-input-group.context";

export type {
  DateFieldControl,
  DateFieldControlContext,
  DateInputGroupContext,
  DateInputGroupOwnerContext,
} from "./date-input-group.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {dateInputGroupVariants} from "@ropav/styles";

export type {DateInputGroupVariants} from "@ropav/styles";
