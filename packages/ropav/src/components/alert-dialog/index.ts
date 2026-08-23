import AlertDialogBackdrop from "./alert-dialog-backdrop.vue";
import AlertDialogBody from "./alert-dialog-body.vue";
import AlertDialogCloseTrigger from "./alert-dialog-close-trigger.vue";
import AlertDialogClose from "./alert-dialog-close.vue";
import AlertDialogContainer from "./alert-dialog-container.vue";
import AlertDialogDialog from "./alert-dialog-dialog.vue";
import AlertDialogFooter from "./alert-dialog-footer.vue";
import AlertDialogHeader from "./alert-dialog-header.vue";
import AlertDialogHeading from "./alert-dialog-heading.vue";
import AlertDialogIcon from "./alert-dialog-icon.vue";
import AlertDialogRoot from "./alert-dialog-root.vue";
import AlertDialogTrigger from "./alert-dialog-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const AlertDialog = Object.assign(AlertDialogRoot, {
  Backdrop: AlertDialogBackdrop,
  Body: AlertDialogBody,
  Close: AlertDialogClose,
  CloseTrigger: AlertDialogCloseTrigger,
  Container: AlertDialogContainer,
  Dialog: AlertDialogDialog,
  Footer: AlertDialogFooter,
  Header: AlertDialogHeader,
  Heading: AlertDialogHeading,
  Icon: AlertDialogIcon,
  Root: AlertDialogRoot,
  Trigger: AlertDialogTrigger,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogClose,
  AlertDialogCloseTrigger,
  AlertDialogContainer,
  AlertDialogDialog,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogHeading,
  AlertDialogIcon,
  AlertDialogRoot,
  AlertDialogTrigger,
};

export type {
  AlertDialogBackdropProps,
  AlertDialogBodyProps,
  AlertDialogCloseTriggerProps,
  AlertDialogContainerProps,
  AlertDialogDialogProps,
  AlertDialogDialogSlotProps,
  AlertDialogFooterProps,
  AlertDialogHeaderProps,
  AlertDialogHeadingProps,
  AlertDialogIconProps,
  AlertDialogPlacement,
  AlertDialogRootEmits,
  AlertDialogRootProps,
  AlertDialogRootProps as AlertDialogProps,
  AlertDialogStatus,
  AlertDialogTriggerProps,
} from "./alert-dialog.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { useAlertDialogContext, useAlertDialogOverlayContext } from "./alert-dialog.context";

export type { AlertDialogContext, AlertDialogOverlayContext } from "./alert-dialog.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { alertDialogVariants } from "@ropav/styles";

export type { AlertDialogVariants } from "@ropav/styles";
