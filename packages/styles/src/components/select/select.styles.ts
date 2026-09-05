import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const selectVariants = tv({
  defaultVariants: {
    fullWidth: false,
    size: "md",
    variant: "primary",
  },
  slots: {
    base: "rp-select",
    indicator: "rp-select__indicator",
    popover: "rp-select__popover",
    trigger: "rp-select__trigger",
    value: "rp-select__value",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "rp-select--full-width",
        trigger: "rp-select__trigger--full-width",
      },
    },
    size: {
      lg: {
        base: "rp-select--lg",
        popover: "rp-select__popover--lg",
      },
      md: {},
      sm: {
        base: "rp-select--sm",
        popover: "rp-select__popover--sm",
      },
    },
    variant: {
      primary: {
        base: "rp-select--primary",
      },
      secondary: {
        base: "rp-select--secondary",
      },
    },
  },
});

export type SelectVariants = VariantProps<typeof selectVariants>;
