import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const numberFieldVariants = tv({
  defaultVariants: {
    fullWidth: false,
    size: "md",
    variant: "primary",
  },
  slots: {
    base: "number-field",
    decrementButton: "number-field__decrement-button",
    group: "number-field__group",
    incrementButton: "number-field__increment-button",
    input: "number-field__input",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "number-field--full-width",
        group: "number-field__group--full-width",
      },
    },
    size: {
      lg: {
        base: "number-field--lg",
      },
      md: {},
      sm: {
        base: "number-field--sm",
      },
    },
    variant: {
      primary: {
        base: "number-field--primary",
      },
      secondary: {
        base: "number-field--secondary",
      },
    },
  },
});

export type NumberFieldVariants = VariantProps<typeof numberFieldVariants>;
