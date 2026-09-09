import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const textAreaVariants = tv({
  base: "rp-textarea",
  defaultVariants: {
    fullWidth: false,
    resize: "none",
    size: "md",
    variant: "primary",
  },
  variants: {
    fullWidth: {
      false: "",
      true: "rp-textarea--full-width",
    },
    resize: {
      both: "rp-textarea--resize-both",
      none: "",
      vertical: "rp-textarea--resize-vertical",
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
