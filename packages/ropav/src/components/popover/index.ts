import PopoverArrow from "./popover-arrow.vue";
import PopoverContent from "./popover-content.vue";
import PopoverDialog from "./popover-dialog.vue";
import PopoverHeading from "./popover-heading.vue";
import PopoverRoot from "./popover-root.vue";
import PopoverTrigger from "./popover-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  PopoverArrow,
  PopoverContent,
  PopoverDialog,
  PopoverHeading,
  PopoverRoot as Popover,
  PopoverTrigger,
};

export type {
  PopoverArrowProps,
  PopoverContentProps,
  PopoverDialogProps,
  PopoverDialogSlotProps,
  PopoverHeadingProps,
  PopoverRootEmits as PopoverEmits,
  PopoverRootProps as PopoverProps,
  PopoverTriggerProps,
} from "./popover.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { usePopoverContext } from "./popover.context";

export type { PopoverContext } from "./popover.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { popoverVariants } from "@ropav/styles";

export type { PopoverVariants } from "@ropav/styles";
