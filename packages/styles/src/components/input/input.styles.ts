import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const inputVariants = tv({
  base: "rp-input",
  defaultVariants: {
    fullWidth: false,
    size: "md",
    variant: "primary",
  },
  variants: {
    fullWidth: {
      false: "",
      true: "rp-input--full-width",
    },
    size: {
      lg: "rp-input--lg",
      md: "",
      sm: "rp-input--sm",
    },
    variant: {
      primary: "rp-input--primary",
      secondary: "rp-input--secondary",
    },
  },
});

export type InputVariants = VariantProps<typeof inputVariants>;
