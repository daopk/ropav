import SegmentedControlIndicator from "./segmented-control-indicator.vue";
import SegmentedControlItem from "./segmented-control-item.vue";
import SegmentedControlRoot from "./segmented-control-root.vue";
import SegmentedControlSeparator from "./segmented-control-separator.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  SegmentedControlRoot as SegmentedControl,
  SegmentedControlItem,
  SegmentedControlIndicator,
  SegmentedControlSeparator,
};

export type {
  SegmentedControlRootProps as SegmentedControlProps,
  SegmentedControlRootSlotProps as SegmentedControlSlotProps,
  SegmentedControlItemProps,
  SegmentedControlItemSlotProps,
  SegmentedControlIndicatorProps,
  SegmentedControlSeparatorProps,
  SegmentedControlOrientation,
} from "./segmented-control.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {
  useSegmentedControlContext,
  useSegmentedControlItemContext,
} from "./segmented-control.context";

export type {
  SegmentedControlContext,
  SegmentedControlItemContext,
} from "./segmented-control.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { segmentedControlVariants } from "@ropav/styles";

export type { SegmentedControlVariants } from "@ropav/styles";
