import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const errorMessageVariants = tv({
  base: "rp-error-message",
});

export type ErrorMessageVariants = VariantProps<typeof errorMessageVariants>;
