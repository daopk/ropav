import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const breadcrumbsVariants = tv({
  slots: {
    base: "rp-breadcrumbs",
    item: "rp-breadcrumbs__item",
    link: "rp-breadcrumbs__link",
    separator: "rp-breadcrumbs__separator",
  },
});

export type BreadcrumbsVariants = VariantProps<typeof breadcrumbsVariants>;
