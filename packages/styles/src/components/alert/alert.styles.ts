import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const alertVariants = tv({
  defaultVariants: {
    status: "default",
  },
  slots: {
    base: "rp-alert",
    content: "rp-alert__content",
    description: "rp-alert__description",
    indicator: "rp-alert__indicator",
    title: "rp-alert__title",
  },
  variants: {
    status: {
      accent: {
        base: "rp-alert--accent",
      },
      danger: {
        base: "rp-alert--danger",
      },
      default: {
        base: "rp-alert--default",
      },
      success: {
        base: "rp-alert--success",
      },
      warning: {
        base: "rp-alert--warning",
      },
    },
  },
});

export type AlertVariants = VariantProps<typeof alertVariants>;
