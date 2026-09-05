import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const switchGroupVariants = tv({
  defaultVariants: {
    orientation: "vertical",
  },
  slots: {
    base: "rp-switch-group",
    items: "rp-switch-group__items",
  },
  variants: {
    orientation: {
      horizontal: {
        base: "rp-switch-group--horizontal",
      },
      vertical: {
        base: "rp-switch-group--vertical",
      },
    },
  },
});

export type SwitchGroupVariants = VariantProps<typeof switchGroupVariants>;
