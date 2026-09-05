import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

const cardVariants = tv({
  defaultVariants: {
    variant: "default",
  },
  slots: {
    base: "rp-card",
    content: "rp-card__content",
    description: "rp-card__description",
    footer: "rp-card__footer",
    header: "rp-card__header",
    title: "rp-card__title",
  },
  variants: {
    variant: {
      default: {
        base: "rp-card--default",
      },
      secondary: {
        base: "rp-card--secondary",
      },
      tertiary: {
        base: "rp-card--tertiary",
      },
      transparent: {
        base: "rp-card--transparent",
      },
    },
  },
});

export { cardVariants };
export type CardVariants = VariantProps<typeof cardVariants>;
