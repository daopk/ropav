import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const textFieldVariants = tv({
  base: "rp-textfield",
  defaultVariants: {
    fullWidth: false,
  },
  variants: {
    fullWidth: {
      false: "",
      true: "rp-textfield--full-width",
    },
  },
});

export type TextFieldVariants = VariantProps<typeof textFieldVariants>;
