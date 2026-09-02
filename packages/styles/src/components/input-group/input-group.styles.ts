import type { VariantProps } from "tailwind-variants";

import { tv } from "tailwind-variants";

export const inputGroupVariants = tv({
  defaultVariants: {
    fullWidth: false,
    size: "md",
    variant: "primary",
  },
  slots: {
    base: "input-group",
    input: "input-group__input",
    prefix: "input-group__prefix",
    suffix: "input-group__suffix",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "input-group--full-width",
      },
    },
    size: {
      lg: {
        base: "input-group--lg",
      },
      md: {},
      sm: {
        base: "input-group--sm",
      },
    },
    variant: {
      primary: {
        base: "input-group--primary",
      },
      secondary: {
        base: "input-group--secondary",
      },
    },
  },
});

export type InputGroupVariants = VariantProps<typeof inputGroupVariants>;
