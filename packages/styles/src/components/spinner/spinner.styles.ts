import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const spinnerVariants = tv({
  base: "rp-spinner",
  defaultVariants: {
    color: "accent",
    size: "md",
  },
  variants: {
    color: {
      accent: "rp-spinner--accent",
      current: "rp-spinner--current",
      danger: "rp-spinner--danger",
      success: "rp-spinner--success",
      warning: "rp-spinner--warning",
    },
    size: {
      lg: "rp-spinner--lg",
      md: "rp-spinner--md",
      sm: "rp-spinner--sm",
      xl: "rp-spinner--xl",
    },
  },
});

export type SpinnerVariants = VariantProps<typeof spinnerVariants>;
