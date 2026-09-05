import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const menuVariants = tv({
  base: "rp-menu",
  defaultVariants: {
    size: "md",
  },
  variants: {
    size: {
      lg: "rp-menu--lg",
      md: "",
      sm: "rp-menu--sm",
    },
  },
});

export type MenuVariants = VariantProps<typeof menuVariants>;
