import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const errorMessageVariants = tv({
  base: "error-message",
});

export type ErrorMessageVariants = VariantProps<typeof errorMessageVariants>;
