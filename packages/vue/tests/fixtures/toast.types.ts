import type {QueuedToast, ToastQueue} from "@/components/toast/toast-queue";
import type {UseToastRegionReturn, UseToastReturn} from "@/composables";

export interface ToastHostProps {
  onReady?: (api: UseToastReturn) => void;
  /** Renders a description part, so the claim that resolves `aria-describedby` is exercised. */
  showDescription?: boolean;
  toast: QueuedToast;
}

export interface ToastRegionHostProps {
  /** Overrides the generated notification-count label. */
  ariaLabel?: string;
  onReady?: (api: UseToastRegionReturn) => void;
  queue: ToastQueue;
}
