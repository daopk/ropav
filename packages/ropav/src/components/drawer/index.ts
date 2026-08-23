import DrawerBackdrop from "./drawer-backdrop.vue";
import DrawerBody from "./drawer-body.vue";
import DrawerCloseTrigger from "./drawer-close-trigger.vue";
import DrawerClose from "./drawer-close.vue";
import DrawerContent from "./drawer-content.vue";
import DrawerDialog from "./drawer-dialog.vue";
import DrawerFooter from "./drawer-footer.vue";
import DrawerHandle from "./drawer-handle.vue";
import DrawerHeader from "./drawer-header.vue";
import DrawerHeading from "./drawer-heading.vue";
import DrawerRoot from "./drawer-root.vue";
import DrawerTrigger from "./drawer-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Drawer = Object.assign(DrawerRoot, {
  Backdrop: DrawerBackdrop,
  Body: DrawerBody,
  Close: DrawerClose,
  CloseTrigger: DrawerCloseTrigger,
  Content: DrawerContent,
  Dialog: DrawerDialog,
  Footer: DrawerFooter,
  Handle: DrawerHandle,
  Header: DrawerHeader,
  Heading: DrawerHeading,
  Root: DrawerRoot,
  Trigger: DrawerTrigger,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  DrawerBackdrop,
  DrawerBody,
  DrawerClose,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerDialog,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerHeading,
  DrawerRoot,
  DrawerTrigger,
};

export type {
  DrawerBackdropProps,
  DrawerBodyProps,
  DrawerCloseTriggerProps,
  DrawerContentProps,
  DrawerDialogProps,
  DrawerDialogSlotProps,
  DrawerFooterProps,
  DrawerHandleProps,
  DrawerHeaderProps,
  DrawerHeadingProps,
  DrawerPlacement,
  DrawerRootEmits,
  DrawerRootProps,
  DrawerRootProps as DrawerProps,
  DrawerTriggerProps,
} from "./drawer.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {useDrawerContext, useDrawerOverlayContext} from "./drawer.context";

export type {DrawerContext, DrawerOverlayContext} from "./drawer.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {drawerVariants} from "@ropav/styles";

export type {DrawerVariants} from "@ropav/styles";
