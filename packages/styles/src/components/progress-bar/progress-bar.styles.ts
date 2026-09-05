import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const progressBarVariants = tv({
  defaultVariants: {
    color: "accent",
    isAnimated: false,
    isStriped: false,
    size: "md",
  },
  slots: {
    base: "rp-progress-bar",
    fill: "rp-progress-bar__fill",
    output: "rp-progress-bar__output",
    track: "rp-progress-bar__track",
  },
  variants: {
    color: {
      accent: {
        base: "rp-progress-bar--accent",
      },
      danger: {
        base: "rp-progress-bar--danger",
      },
      default: {
        base: "rp-progress-bar--default",
      },
      success: {
        base: "rp-progress-bar--success",
      },
      warning: {
        base: "rp-progress-bar--warning",
      },
    },
    isAnimated: {
      false: {},
      true: {
        base: "rp-progress-bar--animated",
      },
    },
    isStriped: {
      false: {},
      true: {
        base: "rp-progress-bar--striped",
      },
    },
    size: {
      lg: {
        base: "rp-progress-bar--lg",
      },
      md: {
        base: "rp-progress-bar--md",
      },
      sm: {
        base: "rp-progress-bar--sm",
      },
    },
  },
});

export type ProgressBarVariants = VariantProps<typeof progressBarVariants>;
