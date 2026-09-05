import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const searchFieldVariants = tv({
  defaultVariants: {
    fullWidth: false,
    size: "md",
    variant: "primary",
  },
  slots: {
    base: "rp-search-field",
    clearButton: "rp-search-field__clear-button",
    group: "rp-search-field__group",
    input: "rp-search-field__input",
    searchIcon: "rp-search-field__search-icon",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "rp-search-field--full-width",
        group: "rp-search-field__group--full-width",
      },
    },
    size: {
      lg: {
        base: "rp-search-field--lg",
      },
      md: {},
      sm: {
        base: "rp-search-field--sm",
      },
    },
    variant: {
      primary: {
        base: "rp-search-field--primary",
      },
      secondary: {
        base: "rp-search-field--secondary",
      },
    },
  },
});

export type SearchFieldVariants = VariantProps<typeof searchFieldVariants>;
