import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const badgeVariants = tv({
  defaultVariants: {
    color: "default",
    placement: "top-right",
    size: "md",
    variant: "primary",
  },
  slots: {
    anchor: "rp-badge-anchor",
    base: "rp-badge",
    label: "rp-badge__label",
  },
  variants: {
    color: {
      accent: {
        base: "rp-badge--accent",
      },
      danger: {
        base: "rp-badge--danger",
      },
      default: {
        base: "rp-badge--default",
      },
      success: {
        base: "rp-badge--success",
      },
      warning: {
        base: "rp-badge--warning",
      },
    },
    placement: {
      "bottom-left": {
        base: "rp-badge--bottom-left",
      },
      "bottom-right": {
        base: "rp-badge--bottom-right",
      },
      "top-left": {
        base: "rp-badge--top-left",
      },
      "top-right": {
        base: "rp-badge--top-right",
      },
    },
    size: {
      lg: {
        base: "rp-badge--lg",
      },
      md: {
        base: "rp-badge--md",
      },
      sm: {
        base: "rp-badge--sm",
      },
    },
    variant: {
      primary: {
        base: "rp-badge--primary",
      },
      secondary: {
        base: "rp-badge--secondary",
      },
      soft: {
        base: "rp-badge--soft",
      },
    },
  },
});

export type BadgeVariants = VariantProps<typeof badgeVariants>;
