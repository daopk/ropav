import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const tooltipVariants = tv({
  slots: {
    base: "rp-tooltip",
    trigger: "rp-tooltip__trigger",
  },
});

export type TooltipVariants = VariantProps<typeof tooltipVariants>;
