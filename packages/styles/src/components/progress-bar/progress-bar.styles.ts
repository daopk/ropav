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
    base: "progress-bar",
    fill: "progress-bar__fill",
    output: "progress-bar__output",
    track: "progress-bar__track",
  },
  variants: {
    color: {
      accent: {
        base: "progress-bar--accent",
      },
      danger: {
        base: "progress-bar--danger",
      },
      default: {
        base: "progress-bar--default",
      },
      success: {
        base: "progress-bar--success",
      },
      warning: {
        base: "progress-bar--warning",
      },
    },
    isAnimated: {
      false: {},
      true: {
        base: "progress-bar--animated",
      },
    },
    isStriped: {
      false: {},
      true: {
        base: "progress-bar--striped",
      },
    },
    size: {
      lg: {
        base: "progress-bar--lg",
      },
      md: {
        base: "progress-bar--md",
      },
      sm: {
        base: "progress-bar--sm",
      },
    },
  },
});

export type ProgressBarVariants = VariantProps<typeof progressBarVariants>;
