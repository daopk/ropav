import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const meterVariants = tv({
  defaultVariants: {
    color: "accent",
    size: "md",
  },
  slots: {
    base: "rp-meter",
    fill: "rp-meter__fill",
    output: "rp-meter__output",
    track: "rp-meter__track",
  },
  variants: {
    color: {
      accent: {
        base: "rp-meter--accent",
      },
      danger: {
        base: "rp-meter--danger",
      },
      default: {
        base: "rp-meter--default",
      },
      success: {
        base: "rp-meter--success",
      },
      warning: {
        base: "rp-meter--warning",
      },
    },
    size: {
      lg: {
        base: "rp-meter--lg",
      },
      md: {
        base: "rp-meter--md",
      },
      sm: {
        base: "rp-meter--sm",
      },
    },
  },
});

export type MeterVariants = VariantProps<typeof meterVariants>;
