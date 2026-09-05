import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const surfaceVariants = tv({
  base: "rp-surface",
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: "rp-surface--default",
      secondary: "rp-surface--secondary",
      tertiary: "rp-surface--tertiary",
      transparent: "rp-surface--transparent",
    },
  },
});

export type SurfaceVariants = VariantProps<typeof surfaceVariants>;
