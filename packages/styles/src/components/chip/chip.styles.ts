import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const chipVariants = tv({
  defaultVariants: {
    color: "default",
    variant: "secondary",
  },
  slots: {
    base: "rp-chip",
    label: "rp-chip__label",
  },
  variants: {
    color: {
      accent: {
        base: "rp-chip--accent",
      },
      danger: {
        base: "rp-chip--danger",
      },
      default: {
        base: "rp-chip--default",
      },
      success: {
        base: "rp-chip--success",
      },
      warning: {
        base: "rp-chip--warning",
      },
    },
    size: {
      lg: {
        base: "rp-chip--lg",
      },
      md: {
        base: "rp-chip--md",
      },
      sm: {
        base: "rp-chip--sm",
      },
    },
    variant: {
      primary: {
        base: "rp-chip--primary",
      },
      secondary: {
        base: "rp-chip--secondary",
      },
      soft: {
        base: "rp-chip--soft",
      },
      tertiary: {
        base: "rp-chip--tertiary",
      },
    },
  },
});

export type ChipVariants = VariantProps<typeof chipVariants>;
