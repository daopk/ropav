import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const checkboxVariants = tv({
  defaultVariants: {
    variant: "primary",
  },
  slots: {
    base: "rp-checkbox",
    content: "rp-checkbox__content",
    control: "rp-checkbox__control",
    indicator: "rp-checkbox__indicator",
  },
  variants: {
    variant: {
      primary: {
        base: "rp-checkbox--primary",
      },
      secondary: {
        base: "rp-checkbox--secondary",
      },
    },
  },
});

export type CheckboxVariants = VariantProps<typeof checkboxVariants>;
