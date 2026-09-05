import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const calendarVariants = tv({
  defaultVariants: {},
  slots: {
    /** Root calendar container */
    base: "rp-calendar",
    /** Calendar cell (td) */
    cell: "rp-calendar__cell",
    /** Cell indicator (small dot at bottom of cell) */
    cellIndicator: "rp-calendar__cell-indicator",
    /** Calendar grid (table) */
    grid: "rp-calendar__grid",
    /** Grid body (tbody) */
    gridBody: "rp-calendar__grid-body",
    /** Grid header (thead) */
    gridHeader: "rp-calendar__grid-header",
    /** Grid row (tr) */
    gridRow: "rp-calendar__grid-row",
    /** Calendar header containing heading and navigation */
    header: "rp-calendar__header",
    /** Header cell (th - day names) */
    headerCell: "rp-calendar__header-cell",
    /** Month/year heading text */
    heading: "rp-calendar__heading",
    /** Previous/Next navigation button */
    navButton: "rp-calendar__nav-button",
    /** Navigation button icon */
    navButtonIcon: "rp-calendar__nav-button-icon",
  },
  variants: {},
});

export type CalendarVariants = VariantProps<typeof calendarVariants>;
