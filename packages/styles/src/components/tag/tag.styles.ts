import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const tagVariants = tv({
  defaultVariants: {
    size: "md",
    variant: "default",
  },
  slots: {
    base: "rp-tag",
    removeButton: "rp-tag__remove-button",
  },
  variants: {
    size: {
      lg: {
        base: "rp-tag--lg",
      },
      md: {
        base: "rp-tag--md",
      },
      sm: {
        base: "rp-tag--sm",
      },
    },
    variant: {
      default: {
        base: "rp-tag--default",
      },
      surface: {
        base: "rp-tag--surface",
      },
    },
  },
});

export type TagVariants = VariantProps<typeof tagVariants>;
