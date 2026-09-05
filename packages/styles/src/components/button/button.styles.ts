import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const buttonVariants = tv({
  base: "rp-button",
  defaultVariants: {
    fullWidth: false,
    isIconOnly: false,
    size: "md",
    variant: "primary",
  },
  variants: {
    fullWidth: {
      false: "",
      true: "rp-button--full-width",
    },
    isIconOnly: {
      true: "rp-button--icon-only",
    },
    size: {
      lg: "rp-button--lg",
      md: "rp-button--md",
      sm: "rp-button--sm",
    },
    variant: {
      danger: "rp-button--danger",
      "danger-soft": "rp-button--danger-soft",
      ghost: "rp-button--ghost",
      outline: "rp-button--outline",
      primary: "rp-button--primary",
      secondary: "rp-button--secondary",
      tertiary: "rp-button--tertiary",
    },
  },
});

export type ButtonVariants = VariantProps<typeof buttonVariants>;
