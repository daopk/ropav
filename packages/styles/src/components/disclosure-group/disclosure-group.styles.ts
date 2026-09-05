import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const disclosureGroupVariants = tv({
  defaultVariants: {},
  slots: {
    base: "rp-disclosure-group",
  },
  variants: {},
});

export type DisclosureGroupVariants = VariantProps<typeof disclosureGroupVariants>;
