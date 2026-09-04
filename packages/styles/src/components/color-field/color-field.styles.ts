import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const colorFieldVariants = tv({
  base: "color-field",
  defaultVariants: {
    fullWidth: false,
  },
  variants: {
    fullWidth: {
      false: "",
      true: "color-field--full-width",
    },
  },
});

export type ColorFieldVariants = VariantProps<typeof colorFieldVariants>;
