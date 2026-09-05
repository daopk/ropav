import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const toggleButtonVariants = tv({
  base: "rp-toggle-button",
  defaultVariants: {
    isIconOnly: false,
    size: "md",
    variant: "default",
  },
  variants: {
    isIconOnly: {
      true: "rp-toggle-button--icon-only",
    },
    size: {
      lg: "rp-toggle-button--lg",
      md: "rp-toggle-button--md",
      sm: "rp-toggle-button--sm",
    },
    variant: {
      default: "rp-toggle-button--default",
      ghost: "rp-toggle-button--ghost",
    },
  },
});

export type ToggleButtonVariants = VariantProps<typeof toggleButtonVariants>;
