import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const drawerVariants = tv({
  defaultVariants: {
    placement: "bottom",
    variant: "opaque",
  },
  slots: {
    backdrop: "rp-drawer__backdrop",
    body: "rp-drawer__body",
    closeTrigger: "rp-drawer__close-trigger",
    content: "rp-drawer__content",
    dialog: "rp-drawer__dialog",
    footer: "rp-drawer__footer",
    handle: "rp-drawer__handle",
    header: "rp-drawer__header",
    heading: "rp-drawer__heading",
    trigger: "rp-drawer__trigger",
  },
  variants: {
    placement: {
      bottom: {
        content: "rp-drawer__content--bottom",
        dialog: "rp-drawer__dialog--bottom",
      },
      left: {
        content: "rp-drawer__content--left",
        dialog: "rp-drawer__dialog--left",
      },
      right: {
        content: "rp-drawer__content--right",
        dialog: "rp-drawer__dialog--right",
      },
      top: {
        content: "rp-drawer__content--top",
        dialog: "rp-drawer__dialog--top",
      },
    },
    variant: {
      blur: {
        backdrop: "rp-drawer__backdrop--blur",
      },
      opaque: {
        backdrop: "rp-drawer__backdrop--opaque",
      },
      transparent: {
        backdrop: "rp-drawer__backdrop--transparent",
      },
    },
  },
});

export type DrawerVariants = VariantProps<typeof drawerVariants>;
