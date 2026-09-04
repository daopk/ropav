import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const calendarYearPickerVariants = tv({
  slots: {
    trigger: "calendar-year-picker__trigger",
    triggerHeading: "calendar-year-picker__trigger-heading",
    triggerIndicator: "calendar-year-picker__trigger-indicator",
    yearCell: "calendar-year-picker__year-cell",
    yearGrid: "calendar-year-picker__year-grid",
  },
});

export type CalendarYearPickerVariants = VariantProps<typeof calendarYearPickerVariants>;
