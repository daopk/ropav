import ToastActionButton from "./toast-action-button.vue";
import ToastCloseButton from "./toast-close-button.vue";
import ToastContent from "./toast-content.vue";
import ToastDescription from "./toast-description.vue";
import ToastIndicator from "./toast-indicator.vue";
import ToastProvider from "./toast-provider.vue";
import { ToastQueue, toast } from "./toast-queue";
import ToastRoot from "./toast-root.vue";
import ToastTitle from "./toast-title.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Toast = Object.assign(ToastRoot, {
  ActionButton: ToastActionButton,
  CloseButton: ToastCloseButton,
  Content: ToastContent,
  Description: ToastDescription,
  Indicator: ToastIndicator,
  Provider: ToastProvider,
  Queue: ToastQueue,
  Root: ToastRoot,
  Title: ToastTitle,
  toast,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  ToastActionButton,
  ToastCloseButton,
  ToastContent,
  ToastDescription,
  ToastIndicator,
  ToastProvider,
  ToastRoot,
  ToastTitle,
};

export type {
  ToastActionButtonProps,
  ToastActionValue,
  ToastAddOptions,
  ToastCloseButtonProps,
  ToastContentProps,
  ToastContentValue,
  ToastDescriptionProps,
  ToastIndicatorProps,
  ToastOptions,
  ToastPromiseOptions,
  ToastProviderProps,
  ToastProviderSlotProps,
  ToastQueueOptions,
  ToastRenderable,
  ToastRootProps,
  ToastRootProps as ToastProps,
  ToastTitleProps,
  QueuedToast,
} from "./toast.types";

/* -------------------------------------------------------------------------------------------------
 * Queue
 * -----------------------------------------------------------------------------------------------*/
export {
  ToastQueue,
  createToastFunction,
  getQueuedToastCount,
  resetToastQueue,
  toast,
  toastQueue,
  useToastQueue,
} from "./toast-queue";

export type { Timer } from "./toast-queue";

export type { ToastFunction, UseToastQueueReturn } from "./toast-queue";

export {
  DEFAULT_GAP,
  DEFAULT_MAX_VISIBLE_TOAST,
  DEFAULT_SCALE_FACTOR,
  DEFAULT_TOAST_TIMEOUT,
  DEFAULT_TOAST_WIDTH,
} from "./toast.constants";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { useToastItemContext, useToastRegionContext } from "./toast.context";

export type { ToastItemContext, ToastRegionContext } from "./toast.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { toastVariants } from "@ropav/styles";

export type { ToastVariants } from "@ropav/styles";
