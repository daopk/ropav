import SegmentedControlIndicator from "./segmented-control-indicator.vue";
import SegmentedControlItem from "./segmented-control-item.vue";
import SegmentedControlRoot from "./segmented-control-root.vue";
import SegmentedControlSeparator from "./segmented-control-separator.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const SegmentedControl = Object.assign(SegmentedControlRoot, {
  Indicator: SegmentedControlIndicator,
  Item: SegmentedControlItem,
  Root: SegmentedControlRoot,
  Separator: SegmentedControlSeparator,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  SegmentedControlRoot,
  SegmentedControlItem,
  SegmentedControlIndicator,
  SegmentedControlSeparator,
};

export type {
  SegmentedControlRootProps,
  SegmentedControlRootProps as SegmentedControlProps,
  SegmentedControlRootSlotProps,
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
