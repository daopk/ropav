import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const colorPickerVariants = tv({
  slots: {
    base: "rp-color-picker",
    popover: "rp-color-picker__popover",
    trigger: "rp-color-picker__trigger",
  },
});

export type ColorPickerVariants = VariantProps<typeof colorPickerVariants>;
