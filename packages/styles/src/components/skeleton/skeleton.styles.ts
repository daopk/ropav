import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const skeletonVariants = tv({
  defaultVariants: {
    animationType: "shimmer",
  },
  slots: {
    base: "skeleton",
  },
  variants: {
    animationType: {
      none: "skeleton--none",
      pulse: "skeleton--pulse",
      shimmer: "skeleton--shimmer",
    },
  },
});

export type SkeletonVariants = VariantProps<typeof skeletonVariants>;
