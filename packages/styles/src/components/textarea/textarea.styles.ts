import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const textAreaVariants = tv({
  base: "rp-textarea",
  defaultVariants: {
    fullWidth: false,
    size: "md",
    variant: "primary",
  },
  variants: {
    fullWidth: {
      false: "",
      true: "rp-textarea--full-width",
    },
    size: {
      lg: "rp-textarea--lg",
      md: "",
      sm: "rp-textarea--sm",
    },
    variant: {
      primary: "rp-textarea--primary",
      secondary: "rp-textarea--secondary",
    },
  },
});

export type TextAreaVariants = VariantProps<typeof textAreaVariants>;
