import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const segmentedControlVariants = tv({
  defaultVariants: {
    fullWidth: false,
    size: "md",
  },
  slots: {
    base: "rp-segmented-control",
    indicator: "rp-segmented-control__indicator",
    item: "rp-segmented-control__item",
    separator: "rp-segmented-control__separator",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "rp-segmented-control--full-width",
      },
    },
    size: {
      lg: {
        base: "rp-segmented-control--lg",
      },
      md: {
        base: "rp-segmented-control--md",
      },
      sm: {
        base: "rp-segmented-control--sm",
      },
    },
  },
});

export type SegmentedControlVariants = VariantProps<typeof segmentedControlVariants>;
