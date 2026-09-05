import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const progressCircleVariants = tv({
  defaultVariants: {
    color: "accent",
    size: "md",
  },
  slots: {
    base: "rp-progress-circle",
    fillCircle: "rp-progress-circle__fill-circle",
    track: "rp-progress-circle__track",
    trackCircle: "rp-progress-circle__track-circle",
  },
  variants: {
    color: {
      accent: {
        base: "rp-progress-circle--accent",
      },
      danger: {
        base: "rp-progress-circle--danger",
      },
      default: {
        base: "rp-progress-circle--default",
      },
      success: {
        base: "rp-progress-circle--success",
      },
      warning: {
        base: "rp-progress-circle--warning",
      },
    },
    size: {
      lg: {
        base: "rp-progress-circle--lg",
      },
      md: {
        base: "rp-progress-circle--md",
      },
      sm: {
        base: "rp-progress-circle--sm",
      },
    },
  },
});

export type ProgressCircleVariants = VariantProps<typeof progressCircleVariants>;
