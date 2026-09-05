import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const colorFieldVariants = tv({
  base: "rp-color-field",
  defaultVariants: {
    fullWidth: false,
  },
  variants: {
    fullWidth: {
      false: "",
      true: "rp-color-field--full-width",
    },
  },
});

export type ColorFieldVariants = VariantProps<typeof colorFieldVariants>;
