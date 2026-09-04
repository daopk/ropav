import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const textFieldVariants = tv({
  base: "textfield",
  defaultVariants: {
    fullWidth: false,
  },
  variants: {
    fullWidth: {
      false: "",
      true: "textfield--full-width",
    },
  },
});

export type TextFieldVariants = VariantProps<typeof textFieldVariants>;
