import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

const separatorVariants = tv({
  base: "rp-separator",
  defaultVariants: {
    orientation: "horizontal",
    variant: "default",
  },
  variants: {
    orientation: {
      horizontal: "rp-separator--horizontal",
      vertical: "rp-separator--vertical",
    },
    variant: {
      default: "rp-separator--default",
      secondary: "rp-separator--secondary",
      tertiary: "rp-separator--tertiary",
    },
  },
});

export { separatorVariants };
export type SeparatorVariants = VariantProps<typeof separatorVariants>;
