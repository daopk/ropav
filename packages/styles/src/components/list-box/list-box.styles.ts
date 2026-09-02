import type { VariantProps } from "tailwind-variants";

import { tv } from "tailwind-variants";

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
