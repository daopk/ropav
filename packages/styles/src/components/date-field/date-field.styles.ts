import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const dateFieldVariants = tv({
  base: "date-field",
  defaultVariants: {
    fullWidth: false,
  },
  variants: {
    fullWidth: {
      false: "",
      true: "date-field--full-width",
    },
  },
});

export type DateFieldVariants = VariantProps<typeof dateFieldVariants>;
