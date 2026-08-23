import type { ToastQueue } from "@/components/toast";
import type { ToastVariants } from "@ropav/styles";

export interface ToastFixtureProps {
  ariaLabel?: string;
  class?: string;
  gap?: number;
  maxVisibleToasts?: number;
  placement?: ToastVariants["placement"];
  queue: ToastQueue;
  scaleFactor?: number;
  width?: number | string;
}
