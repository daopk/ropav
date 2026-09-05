import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const alertDialogVariants = tv({
  defaultVariants: {
    size: "md",
    status: "danger",
    variant: "opaque",
  },
  slots: {
    backdrop: "rp-alert-dialog__backdrop",
    body: "rp-alert-dialog__body",
    closeTrigger: "rp-alert-dialog__close-trigger",
    container: "rp-alert-dialog__container",
    dialog: "rp-alert-dialog__dialog",
    footer: "rp-alert-dialog__footer",
    header: "rp-alert-dialog__header",
    heading: "rp-alert-dialog__heading",
    icon: "rp-alert-dialog__icon",
    trigger: "rp-alert-dialog__trigger",
  },
  variants: {
    size: {
      cover: {
        dialog: "rp-alert-dialog__dialog--cover",
      },
      lg: {
        dialog: "rp-alert-dialog__dialog--lg",
      },
      md: {
        dialog: "rp-alert-dialog__dialog--md",
      },
      sm: {
        dialog: "rp-alert-dialog__dialog--sm",
      },
      xs: {
        dialog: "rp-alert-dialog__dialog--xs",
      },
    },
    status: {
      accent: {
        icon: "rp-alert-dialog__icon--accent",
      },
      danger: {
        icon: "rp-alert-dialog__icon--danger",
      },
      default: {
        icon: "rp-alert-dialog__icon--default",
      },
      success: {
        icon: "rp-alert-dialog__icon--success",
      },
      warning: {
        icon: "rp-alert-dialog__icon--warning",
      },
    },
    variant: {
      blur: {
        backdrop: "rp-alert-dialog__backdrop--blur",
      },
      opaque: {
        backdrop: "rp-alert-dialog__backdrop--opaque",
      },
      transparent: {
        backdrop: "rp-alert-dialog__backdrop--transparent",
      },
    },
  },
});

export type AlertDialogVariants = VariantProps<typeof alertDialogVariants>;
