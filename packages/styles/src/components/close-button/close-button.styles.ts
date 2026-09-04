import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const closeButtonVariants = tv({
  base: "close-button",
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: "close-button--default",
    },
  },
});

export type CloseButtonVariants = VariantProps<typeof closeButtonVariants>;
