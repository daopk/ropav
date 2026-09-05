import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const listboxVariants = tv({
  base: "rp-list-box",
  defaultVariants: {
    size: "md",
    variant: "default",
  },
  variants: {
    size: {
      lg: "rp-list-box--lg",
      md: "",
      sm: "rp-list-box--sm",
    },
    variant: {
      danger: "rp-list-box--danger",
      default: "rp-list-box--default",
    },
  },
});

export type ListBoxVariants = VariantProps<typeof listboxVariants>;
