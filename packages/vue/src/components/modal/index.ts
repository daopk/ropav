import ModalBackdrop from "./modal-backdrop.vue";
import ModalContainer from "./modal-container.vue";
import ModalDialog from "./modal-dialog.vue";
import ModalRoot from "./modal-root.vue";
import ModalTrigger from "./modal-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Modal = Object.assign(ModalRoot, {
  Backdrop: ModalBackdrop,
  Container: ModalContainer,
  Dialog: ModalDialog,
  Root: ModalRoot,
  Trigger: ModalTrigger,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {ModalBackdrop, ModalContainer, ModalDialog, ModalRoot, ModalTrigger};

export type {
  ModalBackdropProps,
  ModalContainerProps,
  ModalDialogProps,
  ModalDialogSlotProps,
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
export {modalVariants} from "@heroui/styles";

export type {ModalVariants} from "@heroui/styles";
