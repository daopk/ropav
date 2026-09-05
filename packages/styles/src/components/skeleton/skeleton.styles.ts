import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const skeletonVariants = tv({
  defaultVariants: {
    animationType: "shimmer",
  },
  slots: {
    base: "rp-skeleton",
  },
  variants: {
    animationType: {
      none: "rp-skeleton--none",
      pulse: "rp-skeleton--pulse",
      shimmer: "rp-skeleton--shimmer",
    },
  },
});

export type SkeletonVariants = VariantProps<typeof skeletonVariants>;
