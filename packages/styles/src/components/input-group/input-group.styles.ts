import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const inputGroupVariants = tv({
  defaultVariants: {
    fullWidth: false,
    size: "md",
    variant: "primary",
  },
  slots: {
    base: "rp-input-group",
    input: "rp-input-group__input",
    prefix: "rp-input-group__prefix",
    suffix: "rp-input-group__suffix",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "rp-input-group--full-width",
      },
    },
    size: {
      lg: {
        base: "rp-input-group--lg",
      },
      md: {},
      sm: {
        base: "rp-input-group--sm",
      },
    },
    variant: {
      primary: {
        base: "rp-input-group--primary",
      },
      secondary: {
        base: "rp-input-group--secondary",
      },
    },
  },
});

export type InputGroupVariants = VariantProps<typeof inputGroupVariants>;
