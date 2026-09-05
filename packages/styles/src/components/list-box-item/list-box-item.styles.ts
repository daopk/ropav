import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const listboxItemVariants = tv({
  defaultVariants: {
    variant: "default",
  },
  slots: {
    indicator: "rp-list-box-item__indicator",
    item: "rp-list-box-item",
  },
  variants: {
    variant: {
      danger: {
        item: "rp-list-box-item--danger",
      },
      default: {
        item: "rp-list-box-item--default",
      },
    },
  },
});

export type ListBoxItemVariants = VariantProps<typeof listboxItemVariants>;
