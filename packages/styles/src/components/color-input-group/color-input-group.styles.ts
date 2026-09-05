import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const colorInputGroupVariants = tv({
  defaultVariants: {
    fullWidth: false,
    size: "md",
    variant: "primary",
  },
  slots: {
    base: "rp-color-input-group",
    input: "rp-color-input-group__input",
    prefix: "rp-color-input-group__prefix",
    suffix: "rp-color-input-group__suffix",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "rp-color-input-group--full-width",
      },
    },
    size: {
      lg: {
        base: "rp-color-input-group--lg",
      },
      md: {},
      sm: {
        base: "rp-color-input-group--sm",
      },
    },
    variant: {
      primary: {
        base: "rp-color-input-group--primary",
      },
      secondary: {
        base: "rp-color-input-group--secondary",
      },
    },
  },
});

export type ColorInputGroupVariants = VariantProps<typeof colorInputGroupVariants>;
