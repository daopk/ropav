import type { VariantProps } from "tailwind-variants";

import { tv } from "tailwind-variants";

export const menuVariants = tv({
  base: "menu",
  defaultVariants: {
    size: "md",
  },
  variants: {
    size: {
      lg: "menu--lg",
      md: "",
      sm: "menu--sm",
    },
  },
});

export type MenuVariants = VariantProps<typeof menuVariants>;
