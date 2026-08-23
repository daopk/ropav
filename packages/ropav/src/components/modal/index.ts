import ModalBackdrop from "./modal-backdrop.vue";
import ModalBody from "./modal-body.vue";
import ModalCloseTrigger from "./modal-close-trigger.vue";
import ModalClose from "./modal-close.vue";
import ModalContainer from "./modal-container.vue";
import ModalDialog from "./modal-dialog.vue";
import ModalFooter from "./modal-footer.vue";
import ModalHeader from "./modal-header.vue";
import ModalHeading from "./modal-heading.vue";
import ModalIcon from "./modal-icon.vue";
import ModalRoot from "./modal-root.vue";
import ModalTrigger from "./modal-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Modal = Object.assign(ModalRoot, {
  Backdrop: ModalBackdrop,
  Body: ModalBody,
  Close: ModalClose,
  CloseTrigger: ModalCloseTrigger,
  Container: ModalContainer,
  Dialog: ModalDialog,
  Footer: ModalFooter,
  Header: ModalHeader,
  Heading: ModalHeading,
  Icon: ModalIcon,
  Root: ModalRoot,
  Trigger: ModalTrigger,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  ModalBackdrop,
  ModalBody,
  ModalClose,
  ModalCloseTrigger,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalHeading,
  ModalIcon,
  ModalRoot,
  ModalTrigger,
};

export type {
  ModalBackdropProps,
  ModalBodyProps,
  ModalCloseTriggerProps,
  ModalContainerProps,
  ModalDialogProps,
  ModalDialogSlotProps,
  ModalFooterProps,
  ModalHeaderProps,
  ModalHeadingProps,
  ModalIconProps,
  ModalPlacement,
  ModalRootEmits,
  ModalRootProps,
  ModalRootProps as ModalProps,
  ModalTriggerProps,
} from "./modal.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {useModalContext, useModalOverlayContext} from "./modal.context";

export type {ModalContext, ModalOverlayContext} from "./modal.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {modalVariants} from "@ropav/styles";

export type {ModalVariants} from "@ropav/styles";
