import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const kbdVariants = tv({
  defaultVariants: {},
  slots: {
    abbr: "rp-kbd__abbr",
    base: "rp-kbd",
    content: "rp-kbd__content",
  },
  variants: {
    variant: {
      default: "rp-kbd--default",
      light: "rp-kbd--light",
    },
  },
});

export type KbdVariants = VariantProps<typeof kbdVariants>;
