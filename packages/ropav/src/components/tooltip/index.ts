import TooltipArrow from "./tooltip-arrow.vue";
import TooltipContent from "./tooltip-content.vue";
import TooltipRoot from "./tooltip-root.vue";
import TooltipTrigger from "./tooltip-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Tooltip = Object.assign(TooltipRoot, {
  Arrow: TooltipArrow,
  Content: TooltipContent,
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {TooltipArrow, TooltipContent, TooltipRoot, TooltipTrigger};

export type {
  TooltipArrowProps,
  TooltipContentProps,
  TooltipRootEmits,
  TooltipRootProps,
  TooltipRootProps as TooltipProps,
  TooltipTriggerProps,
} from "./tooltip.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {useTooltipContext} from "./tooltip.context";

export type {TooltipContext} from "./tooltip.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {tooltipVariants} from "@heroui/styles";

export type {TooltipVariants} from "@heroui/styles";
