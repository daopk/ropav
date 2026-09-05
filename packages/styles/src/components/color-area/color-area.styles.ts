import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const colorAreaVariants = tv({
  defaultVariants: {
    showDots: false,
  },
  slots: {
    base: "rp-color-area",
    thumb: "rp-color-area__thumb",
  },
  variants: {
    showDots: {
      false: {},
      true: {
        base: "rp-color-area--show-dots",
      },
    },
  },
});

export type ColorAreaVariants = VariantProps<typeof colorAreaVariants>;
