import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const listboxVariants = tv({
  base: "list-box",
  defaultVariants: {
    size: "md",
    variant: "default",
  },
  variants: {
    size: {
      lg: "list-box--lg",
      md: "",
      sm: "list-box--sm",
    },
    variant: {
      danger: "list-box--danger",
      default: "list-box--default",
    },
  },
});

export type ListBoxVariants = VariantProps<typeof listboxVariants>;
