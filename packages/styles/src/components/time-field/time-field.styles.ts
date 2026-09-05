import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const timeFieldVariants = tv({
  base: "rp-time-field",
  defaultVariants: {
    fullWidth: false,
  },
  variants: {
    fullWidth: {
      false: "",
      true: "rp-time-field--full-width",
    },
  },
});

export type TimeFieldVariants = VariantProps<typeof timeFieldVariants>;
