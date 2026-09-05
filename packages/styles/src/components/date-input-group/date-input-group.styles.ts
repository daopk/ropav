import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const dateInputGroupVariants = tv({
  defaultVariants: {
    fullWidth: false,
    size: "md",
    variant: "primary",
  },
  slots: {
    base: "rp-date-input-group",
    input: "rp-date-input-group__input",
    inputContainer: "rp-date-input-group__input-container",
    prefix: "rp-date-input-group__prefix",
    segment: "rp-date-input-group__segment",
    suffix: "rp-date-input-group__suffix",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "rp-date-input-group--full-width",
      },
    },
    size: {
      lg: {
        base: "rp-date-input-group--lg",
      },
      md: {},
      sm: {
        base: "rp-date-input-group--sm",
      },
    },
    variant: {
      primary: {
        base: "rp-date-input-group--primary",
      },
      secondary: {
        base: "rp-date-input-group--secondary",
      },
    },
  },
});

export type DateInputGroupVariants = VariantProps<typeof dateInputGroupVariants>;
