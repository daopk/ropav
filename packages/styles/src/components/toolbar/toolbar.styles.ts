import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

const toolbarVariants = tv({
  base: "rp-toolbar",
  defaultVariants: {
    isAttached: false,
    orientation: "horizontal",
  },
  variants: {
    isAttached: {
      true: "rp-toolbar--attached",
    },
    orientation: {
      horizontal: "rp-toolbar--horizontal",
      vertical: "rp-toolbar--vertical",
    },
  },
});

export { toolbarVariants };
export type ToolbarVariants = VariantProps<typeof toolbarVariants>;
