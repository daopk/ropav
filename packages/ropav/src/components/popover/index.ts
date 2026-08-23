import PopoverArrow from "./popover-arrow.vue";
import PopoverContent from "./popover-content.vue";
import PopoverDialog from "./popover-dialog.vue";
import PopoverHeading from "./popover-heading.vue";
import PopoverRoot from "./popover-root.vue";
import PopoverTrigger from "./popover-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Popover = Object.assign(PopoverRoot, {
  Arrow: PopoverArrow,
  Content: PopoverContent,
  Dialog: PopoverDialog,
  Heading: PopoverHeading,
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {PopoverArrow, PopoverContent, PopoverDialog, PopoverHeading, PopoverRoot, PopoverTrigger};

export type {
  PopoverArrowProps,
  PopoverContentProps,
  PopoverDialogProps,
  PopoverDialogSlotProps,
  PopoverHeadingProps,
  PopoverRootEmits,
  PopoverRootProps,
  PopoverRootProps as PopoverProps,
  PopoverTriggerProps,
} from "./popover.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {usePopoverContext} from "./popover.context";

export type {PopoverContext} from "./popover.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {popoverVariants} from "@ropav/styles";

export type {PopoverVariants} from "@ropav/styles";
