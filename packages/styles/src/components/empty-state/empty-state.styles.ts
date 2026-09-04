import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const emptyStateVariants = tv({
  base: "empty-state",
});

export type EmptyStateVariants = VariantProps<typeof emptyStateVariants>;
