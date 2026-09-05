import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const dateRangePickerVariants = tv({
  slots: {
    base: "rp-date-range-picker",
    popover: "rp-date-range-picker__popover",
    rangeSeparator: "rp-date-range-picker__range-separator",
    trigger: "rp-date-range-picker__trigger",
    triggerIndicator: "rp-date-range-picker__trigger-indicator",
  },
});

export type DateRangePickerVariants = VariantProps<typeof dateRangePickerVariants>;
