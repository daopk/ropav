import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const fieldErrorVariants = tv({
  base: "field-error",
});

export type FieldErrorVariants = VariantProps<typeof fieldErrorVariants>;
