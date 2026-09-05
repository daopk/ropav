import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const colorSwatchVariants = tv({
  base: "rp-color-swatch",
  defaultVariants: {
    shape: "circle",
    size: "md",
  },
  variants: {
    shape: {
      circle: "rp-color-swatch--circle",
      square: "rp-color-swatch--square",
    },
    size: {
      lg: "rp-color-swatch--lg",
      md: "rp-color-swatch--md",
      sm: "rp-color-swatch--sm",
      xl: "rp-color-swatch--xl",
      xs: "rp-color-swatch--xs",
    },
  },
});

export type ColorSwatchVariants = VariantProps<typeof colorSwatchVariants>;
