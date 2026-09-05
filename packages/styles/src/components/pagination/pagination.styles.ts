import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const paginationVariants = tv({
  defaultVariants: {
    size: "md",
  },
  slots: {
    base: "rp-pagination",
    content: "rp-pagination__content",
    ellipsis: "rp-pagination__ellipsis",
    item: "rp-pagination__item",
    link: "rp-pagination__link",
    summary: "rp-pagination__summary",
  },
  variants: {
    /** A previous/next control rather than a page number, which sizes and spaces differently. */
    isNav: {
      false: {},
      true: {
        link: "rp-pagination__link--nav",
      },
    },
    size: {
      lg: {
        base: "rp-pagination--lg",
      },
      md: {
        base: "rp-pagination--md",
      },
      sm: {
        base: "rp-pagination--sm",
      },
    },
  },
});

export type PaginationVariants = VariantProps<typeof paginationVariants>;
