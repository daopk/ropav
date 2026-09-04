import TooltipArrow from "./tooltip-arrow.vue";
import TooltipContent from "./tooltip-content.vue";
import TooltipRoot from "./tooltip-root.vue";
import TooltipTrigger from "./tooltip-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export { TooltipArrow, TooltipContent, TooltipRoot as Tooltip, TooltipTrigger };

export type {
  TooltipArrowProps,
  TooltipContentProps,
  TooltipRootEmits as TooltipEmits,
  TooltipRootProps as TooltipProps,
  TooltipTriggerProps,
} from "./tooltip.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { useTooltipContext } from "./tooltip.context";

export type { TooltipContext } from "./tooltip.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { tooltipVariants } from "@ropav/styles";

export type { TooltipVariants } from "@ropav/styles";
