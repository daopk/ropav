import SplitterHandle from "./splitter-handle.vue";
import SplitterPanel from "./splitter-panel.vue";
import SplitterRoot from "./splitter-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Splitter = Object.assign(SplitterRoot, {
  Handle: SplitterHandle,
  Panel: SplitterPanel,
  Root: SplitterRoot,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { SplitterRoot, SplitterPanel, SplitterHandle };

export type {
  SplitterRootProps,
  SplitterRootProps as SplitterProps,
  SplitterPanelProps,
  SplitterHandleProps,
  SplitterSlotProps,
  SplitterPanelSlotProps,
  SplitterHandleSlotProps,
} from "./splitter.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { useSplitterContext } from "./splitter.context";

export type { SplitterContext } from "./splitter.context";

export type { SplitterOrientation, SplitterSize } from "./splitter.state";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { splitterVariants } from "@ropav/styles";

export type { SplitterVariants } from "@ropav/styles";
