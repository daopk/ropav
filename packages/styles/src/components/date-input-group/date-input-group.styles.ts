import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const dateInputGroupVariants = tv({
  defaultVariants: {
    fullWidth: false,
    size: "md",
    variant: "primary",
  },
  slots: {
    base: "date-input-group",
    input: "date-input-group__input",
    inputContainer: "date-input-group__input-container",
    prefix: "date-input-group__prefix",
    segment: "date-input-group__segment",
    suffix: "date-input-group__suffix",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "date-input-group--full-width",
      },
    },
    size: {
      lg: {
        base: "date-input-group--lg",
      },
      md: {},
      sm: {
        base: "date-input-group--sm",
      },
    },
    variant: {
      primary: {
        base: "date-input-group--primary",
      },
      secondary: {
        base: "date-input-group--secondary",
      },
    },
  },
});

export type DateInputGroupVariants = VariantProps<typeof dateInputGroupVariants>;
