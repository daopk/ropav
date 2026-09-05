import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const radioGroupVariants = tv({
  base: "rp-radio-group",
  defaultVariants: {
    variant: "primary",
  },
  variants: {
    variant: {
      primary: "rp-radio-group--primary",
      secondary: "rp-radio-group--secondary",
    },
  },
});

export type RadioGroupVariants = VariantProps<typeof radioGroupVariants>;
