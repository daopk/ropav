import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const kbdVariants = tv({
  defaultVariants: {},
  slots: {
    abbr: "kbd__abbr",
    base: "kbd",
    content: "kbd__content",
  },
  variants: {
    variant: {
      default: "kbd--default",
      light: "kbd--light",
    },
  },
});

export type KbdVariants = VariantProps<typeof kbdVariants>;
