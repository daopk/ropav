import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

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
