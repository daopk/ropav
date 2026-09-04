import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const colorInputGroupVariants = tv({
  defaultVariants: {
    fullWidth: false,
    size: "md",
    variant: "primary",
  },
  slots: {
    base: "color-input-group",
    input: "color-input-group__input",
    prefix: "color-input-group__prefix",
    suffix: "color-input-group__suffix",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "color-input-group--full-width",
      },
    },
    size: {
      lg: {
        base: "color-input-group--lg",
      },
      md: {},
      sm: {
        base: "color-input-group--sm",
      },
    },
    variant: {
      primary: {
        base: "color-input-group--primary",
      },
      secondary: {
        base: "color-input-group--secondary",
      },
    },
  },
});

export type ColorInputGroupVariants = VariantProps<typeof colorInputGroupVariants>;
