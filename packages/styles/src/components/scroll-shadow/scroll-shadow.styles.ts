import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const scrollShadowVariants = tv({
  defaultVariants: {
    hideScrollBar: false,
    orientation: "vertical",
    variant: "fade",
  },
  slots: {
    base: "rp-scroll-shadow",
  },
  variants: {
    hideScrollBar: {
      false: {},
      true: {
        base: "rp-scroll-shadow--hide-scrollbar",
      },
    },
    orientation: {
      horizontal: {
        base: "rp-scroll-shadow--horizontal",
      },
      vertical: {
        base: "rp-scroll-shadow--vertical",
      },
    },
    variant: {
      fade: {
        base: "rp-scroll-shadow--fade",
      },
    },
  },
});

export type ScrollShadowVariants = VariantProps<typeof scrollShadowVariants>;
