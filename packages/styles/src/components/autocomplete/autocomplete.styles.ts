import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const autocompleteVariants = tv({
  defaultVariants: {
    fullWidth: false,
    size: "md",
    variant: "primary",
  },
  slots: {
    base: "rp-autocomplete",
    clearButton: "rp-autocomplete__clear-button",
    filter: "rp-autocomplete__filter",
    indicator: "rp-autocomplete__indicator",
    popover: "rp-autocomplete__popover",
    trigger: "rp-autocomplete__trigger",
    value: "rp-autocomplete__value",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "rp-autocomplete--full-width",
        trigger: "rp-autocomplete__trigger--full-width",
      },
    },
    size: {
      lg: {
        base: "rp-autocomplete--lg",
        popover: "rp-autocomplete__popover--lg",
      },
      md: {},
      sm: {
        base: "rp-autocomplete--sm",
        popover: "rp-autocomplete__popover--sm",
      },
    },
    variant: {
      primary: {
        base: "rp-autocomplete--primary",
      },
      secondary: {
        base: "rp-autocomplete--secondary",
      },
    },
  },
});

export type AutocompleteVariants = VariantProps<typeof autocompleteVariants>;
