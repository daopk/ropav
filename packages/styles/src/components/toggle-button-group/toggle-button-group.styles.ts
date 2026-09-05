import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const toggleButtonGroupVariants = tv({
  defaultVariants: {
    fullWidth: false,
    isDetached: false,
    orientation: "horizontal",
  },
  slots: {
    base: "rp-toggle-button-group",
    separator: "rp-toggle-button-group__separator",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "rp-toggle-button-group--full-width",
      },
    },
    isDetached: {
      false: {},
      true: {
        base: "rp-toggle-button-group--detached",
      },
    },
    orientation: {
      horizontal: {
        base: "rp-toggle-button-group--horizontal",
      },
      vertical: {
        base: "rp-toggle-button-group--vertical",
      },
    },
  },
});

export type ToggleButtonGroupVariants = VariantProps<typeof toggleButtonGroupVariants>;
