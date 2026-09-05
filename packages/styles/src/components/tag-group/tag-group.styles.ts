import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const tagGroupVariants = tv({
  slots: {
    base: "rp-tag-group",
    list: "rp-tag-group__list",
  },
});

export type TagGroupVariants = VariantProps<typeof tagGroupVariants>;
