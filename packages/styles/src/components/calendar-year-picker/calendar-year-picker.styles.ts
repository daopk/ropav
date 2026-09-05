import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const calendarYearPickerVariants = tv({
  slots: {
    trigger: "rp-calendar-year-picker__trigger",
    triggerHeading: "rp-calendar-year-picker__trigger-heading",
    triggerIndicator: "rp-calendar-year-picker__trigger-indicator",
    yearCell: "rp-calendar-year-picker__year-cell",
    yearGrid: "rp-calendar-year-picker__year-grid",
  },
});

export type CalendarYearPickerVariants = VariantProps<typeof calendarYearPickerVariants>;
