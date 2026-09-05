import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const buttonGroupVariants = tv({
  defaultVariants: {
    fullWidth: false,
    orientation: "horizontal",
  },
  slots: {
    base: "rp-button-group",
    separator: "rp-button-group__separator",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "rp-button-group--full-width",
      },
    },
    orientation: {
      horizontal: {
        base: "rp-button-group--horizontal",
      },
      vertical: {
        base: "rp-button-group--vertical",
      },
    },
  },
});

export type ButtonGroupVariants = VariantProps<typeof buttonGroupVariants>;
