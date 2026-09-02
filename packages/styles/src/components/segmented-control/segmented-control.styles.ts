import type { VariantProps } from "tailwind-variants";

import { tv } from "tailwind-variants";

export const segmentedControlVariants = tv({
  defaultVariants: {
    fullWidth: false,
    size: "md",
  },
  slots: {
    base: "segmented-control",
    indicator: "segmented-control__indicator",
    item: "segmented-control__item",
    separator: "segmented-control__separator",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "segmented-control--full-width",
      },
    },
    size: {
      lg: {
        base: "segmented-control--lg",
      },
      md: {
        base: "segmented-control--md",
      },
      sm: {
        base: "segmented-control--sm",
      },
    },
  },
});

export type SegmentedControlVariants = VariantProps<typeof segmentedControlVariants>;
