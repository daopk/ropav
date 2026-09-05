import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const descriptionVariants = tv({
  base: "rp-description",
});

export type DescriptionVariants = VariantProps<typeof descriptionVariants>;
