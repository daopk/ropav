import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const numberFieldVariants = tv({
  defaultVariants: {
    fullWidth: false,
    size: "md",
    variant: "primary",
  },
  slots: {
    base: "rp-number-field",
    decrementButton: "rp-number-field__decrement-button",
    group: "rp-number-field__group",
    incrementButton: "rp-number-field__increment-button",
    input: "rp-number-field__input",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "rp-number-field--full-width",
        group: "rp-number-field__group--full-width",
      },
    },
    size: {
      lg: {
        base: "rp-number-field--lg",
      },
      md: {},
      sm: {
        base: "rp-number-field--sm",
      },
    },
    variant: {
      primary: {
        base: "rp-number-field--primary",
      },
      secondary: {
        base: "rp-number-field--secondary",
      },
    },
  },
});

export type NumberFieldVariants = VariantProps<typeof numberFieldVariants>;
