import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const colorSwatchPickerVariants = tv({
  defaultVariants: {
    layout: "grid",
    size: "md",
    variant: "circle",
  },
  slots: {
    base: "rp-color-swatch-picker",
    indicator: "rp-color-swatch-picker__indicator",
    item: "rp-color-swatch-picker__item",
    swatch: "rp-color-swatch-picker__swatch",
  },
  variants: {
    layout: {
      grid: {
        base: "rp-color-swatch-picker--grid",
      },
      stack: {
        base: "rp-color-swatch-picker--stack",
      },
    },
    size: {
      lg: {
        base: "rp-color-swatch-picker--lg",
      },
      md: {
        base: "rp-color-swatch-picker--md",
      },
      sm: {
        base: "rp-color-swatch-picker--sm",
      },
      xl: {
        base: "rp-color-swatch-picker--xl",
      },
      xs: {
        base: "rp-color-swatch-picker--xs",
      },
    },
    variant: {
      circle: {
        base: "rp-color-swatch-picker--circle",
      },
      square: {
        base: "rp-color-swatch-picker--square",
      },
    },
  },
});

export type ColorSwatchPickerVariants = VariantProps<typeof colorSwatchPickerVariants>;
