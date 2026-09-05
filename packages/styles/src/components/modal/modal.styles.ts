import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const modalVariants = tv({
  defaultVariants: {
    scroll: "inside",
    size: "md",
    variant: "opaque",
  },
  slots: {
    backdrop: "rp-modal__backdrop",
    body: "rp-modal__body",
    closeTrigger: "rp-modal__close-trigger",
    container: "rp-modal__container",
    dialog: "rp-modal__dialog",
    footer: "rp-modal__footer",
    header: "rp-modal__header",
    heading: "rp-modal__heading",
    icon: "rp-modal__icon",
    trigger: "rp-modal__trigger",
  },
  variants: {
    scroll: {
      inside: {
        body: "rp-modal__body--scroll-inside",
        dialog: "rp-modal__dialog--scroll-inside",
      },
      outside: {
        body: "rp-modal__body--scroll-outside",
        container: "rp-modal__container--scroll-outside",
        dialog: "rp-modal__dialog--scroll-outside",
      },
    },
    size: {
      cover: {
        dialog: "rp-modal__dialog--cover",
      },
      full: {
        container: "rp-modal__container--full",
        dialog: "rp-modal__dialog--full",
      },
      lg: {
        dialog: "rp-modal__dialog--lg",
      },
      md: {
        dialog: "rp-modal__dialog--md",
      },
      sm: {
        dialog: "rp-modal__dialog--sm",
      },
      xs: {
        dialog: "rp-modal__dialog--xs",
      },
    },
    variant: {
      blur: {
        backdrop: "rp-modal__backdrop--blur",
      },
      opaque: {
        backdrop: "rp-modal__backdrop--opaque",
      },
      transparent: {
        backdrop: "rp-modal__backdrop--transparent",
      },
    },
  },
});

export type ModalVariants = VariantProps<typeof modalVariants>;
