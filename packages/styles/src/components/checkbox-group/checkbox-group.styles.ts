import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const checkboxGroupVariants = tv({
  base: "rp-checkbox-group",
  defaultVariants: {
    variant: "primary",
  },
  variants: {
    variant: {
      primary: "rp-checkbox-group--primary",
      secondary: "rp-checkbox-group--secondary",
    },
  },
});

export type CheckboxGroupVariants = VariantProps<typeof checkboxGroupVariants>;
