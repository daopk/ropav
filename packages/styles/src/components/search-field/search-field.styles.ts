import type { VariantProps } from "tailwind-variants";

import { tv } from "tailwind-variants";

export const searchFieldVariants = tv({
  defaultVariants: {
    fullWidth: false,
    size: "md",
    variant: "primary",
  },
  slots: {
    base: "search-field",
    clearButton: "search-field__clear-button",
    group: "search-field__group",
    input: "search-field__input",
    searchIcon: "search-field__search-icon",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "search-field--full-width",
        group: "search-field__group--full-width",
      },
    },
    size: {
      lg: {
        base: "search-field--lg",
      },
      md: {},
      sm: {
        base: "search-field--sm",
      },
    },
    variant: {
      primary: {
        base: "search-field--primary",
      },
      secondary: {
        base: "search-field--secondary",
      },
    },
  },
});

export type SearchFieldVariants = VariantProps<typeof searchFieldVariants>;
