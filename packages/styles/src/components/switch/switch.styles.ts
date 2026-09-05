import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const switchVariants = tv({
  defaultVariants: {
    size: "md",
  },
  slots: {
    base: "rp-switch",
    content: "rp-switch__content",
    control: "rp-switch__control",
    icon: "rp-switch__icon",
    thumb: "rp-switch__thumb",
  },
  variants: {
    size: {
      lg: {
        base: "rp-switch--lg",
      },
      md: {
        base: "rp-switch--md",
      },
      sm: {
        base: "rp-switch--sm",
      },
    },
  },
});

export type SwitchVariants = VariantProps<typeof switchVariants>;
