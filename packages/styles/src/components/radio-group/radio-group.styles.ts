import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const radioGroupVariants = tv({
  base: "radio-group",
  defaultVariants: {
    variant: "primary",
  },
  variants: {
    variant: {
      primary: "radio-group--primary",
      secondary: "radio-group--secondary",
    },
  },
});

export type RadioGroupVariants = VariantProps<typeof radioGroupVariants>;
