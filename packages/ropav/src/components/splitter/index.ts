import SplitterHandle from "./splitter-handle.vue";
import SplitterPanel from "./splitter-panel.vue";
import SplitterRoot from "./splitter-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { SplitterRoot as Splitter, SplitterPanel, SplitterHandle };

export type {
  SplitterRootProps as SplitterProps,
  SplitterPanelProps,
  SplitterHandleProps,
  SplitterSlotProps,
  SplitterPanelSlotProps,
  SplitterHandleSlotProps,
} from "./splitter.types";

export type { SplitterOrientation, SplitterSize } from "./splitter.state";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { useSplitterContext } from "./splitter.context";

export type { SplitterContext } from "./splitter.context";

export type { SplitterState } from "./splitter.state";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { splitterVariants } from "@ropav/styles";

export type { SplitterVariants } from "@ropav/styles";
