import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const toastVariants = tv({
  defaultVariants: {
    placement: "bottom",
    variant: "default",
  },
  slots: {
    action: "rp-toast__action",
    close: "rp-toast__close-button",
    content: "rp-toast__content",
    description: "rp-toast__description",
    indicator: "rp-toast__indicator",
    region: "rp-toast-region",
    title: "rp-toast__title",
    toast: "rp-toast",
  },
  variants: {
    placement: {
      bottom: {
        region: "rp-toast-region--bottom",
        toast: "rp-toast--bottom",
      },
      "bottom end": {
        region: "rp-toast-region--bottom-end",
        toast: "rp-toast--bottom-end",
      },
      "bottom start": {
        region: "rp-toast-region--bottom-start",
        toast: "rp-toast--bottom-start",
      },
      top: {
        region: "rp-toast-region--top",
        toast: "rp-toast--top",
      },
      "top end": {
        region: "rp-toast-region--top-end",
        toast: "rp-toast--top-end",
      },
      "top start": {
        region: "rp-toast-region--top-start",
        toast: "rp-toast--top-start",
      },
    },
    variant: {
      accent: {
        toast: "rp-toast--accent",
      },
      danger: {
        toast: "rp-toast--danger",
      },
      default: {
        toast: "rp-toast--default",
      },
      success: {
        toast: "rp-toast--success",
      },
      warning: {
        toast: "rp-toast--warning",
      },
    },
  },
});

export type ToastVariants = VariantProps<typeof toastVariants>;
