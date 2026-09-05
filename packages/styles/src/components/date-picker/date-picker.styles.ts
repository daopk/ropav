import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const datePickerVariants = tv({
  slots: {
    base: "rp-date-picker",
    popover: "rp-date-picker__popover",
    trigger: "rp-date-picker__trigger",
    triggerIndicator: "rp-date-picker__trigger-indicator",
  },
});

export type DatePickerVariants = VariantProps<typeof datePickerVariants>;
