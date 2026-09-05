import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const labelVariants = tv({
  base: "rp-label",
  defaultVariants: {
    isDisabled: false,
    isInvalid: false,
    isRequired: false,
  },
  variants: {
    isDisabled: {
      true: "rp-label--disabled",
    },
    isInvalid: {
      true: "rp-label--invalid",
    },
    isRequired: {
      true: "rp-label--required",
    },
  },
});

export type LabelVariants = VariantProps<typeof labelVariants>;
