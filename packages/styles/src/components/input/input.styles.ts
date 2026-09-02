import type { VariantProps } from "tailwind-variants";

import { tv } from "tailwind-variants";

export const inputVariants = tv({
  base: "input",
  defaultVariants: {
    fullWidth: false,
    size: "md",
    variant: "primary",
  },
  variants: {
    fullWidth: {
      false: "",
      true: "input--full-width",
    },
    size: {
      lg: "input--lg",
      md: "",
      sm: "input--sm",
    },
    variant: {
      primary: "input--primary",
      secondary: "input--secondary",
    },
  },
});

export type InputVariants = VariantProps<typeof inputVariants>;
