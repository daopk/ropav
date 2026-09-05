import type { VariantProps } from "../../tv";

import { tv } from "../../tv";

export const rangeCalendarVariants = tv({
  defaultVariants: {},
  slots: {
    /** Root range calendar container */
    base: "rp-range-calendar",
    /** Calendar cell (td) */
    cell: "rp-range-calendar__cell",
    /** Cell indicator (small dot at bottom of cell) */
    cellIndicator: "rp-range-calendar__cell-indicator",
    /** Calendar grid (table) */
    grid: "rp-range-calendar__grid",
    /** Grid body (tbody) */
    gridBody: "rp-range-calendar__grid-body",
    /** Grid header (thead) */
    gridHeader: "rp-range-calendar__grid-header",
    /** Grid row (tr) */
    gridRow: "rp-range-calendar__grid-row",
    /** Calendar header containing heading and navigation */
    header: "rp-range-calendar__header",
    /** Header cell (th - day names) */
    headerCell: "rp-range-calendar__header-cell",
    /** Month/year heading text */
    heading: "rp-range-calendar__heading",
    /** Previous/Next navigation button */
    navButton: "rp-range-calendar__nav-button",
    /** Navigation button icon */
    navButtonIcon: "rp-range-calendar__nav-button-icon",
  },
  variants: {},
});

export type RangeCalendarVariants = VariantProps<typeof rangeCalendarVariants>;
