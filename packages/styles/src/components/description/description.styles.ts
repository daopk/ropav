import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const descriptionVariants = tv({
  base: "description",
});

export type DescriptionVariants = VariantProps<typeof descriptionVariants>;
