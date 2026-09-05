import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const popoverVariants = tv({
  slots: {
    base: "rp-popover",
    dialog: "rp-popover__dialog",
    heading: "rp-popover__heading",
    trigger: "rp-popover__trigger",
  },
});

export type PopoverVariants = VariantProps<typeof popoverVariants>;
