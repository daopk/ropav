import {
  CalendarYearPickerCell,
  CalendarYearPickerGrid,
  CalendarYearPickerGridBody,
  CalendarYearPickerTrigger,
  CalendarYearPickerTriggerHeading,
  CalendarYearPickerTriggerIndicator,
} from "../calendar-year-picker";

import RangeCalendarCellIndicator from "./range-calendar-cell-indicator.vue";
import RangeCalendarCell from "./range-calendar-cell.vue";
import RangeCalendarGridBody from "./range-calendar-grid-body.vue";
import RangeCalendarGridHeader from "./range-calendar-grid-header.vue";
import RangeCalendarGrid from "./range-calendar-grid.vue";
import RangeCalendarHeaderCell from "./range-calendar-header-cell.vue";
import RangeCalendarHeader from "./range-calendar-header.vue";
import RangeCalendarHeading from "./range-calendar-heading.vue";
import RangeCalendarNavButton from "./range-calendar-nav-button.vue";
import RangeCalendarRoot from "./range-calendar-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const RangeCalendar = Object.assign(RangeCalendarRoot, {
  Cell: RangeCalendarCell,
  CellIndicator: RangeCalendarCellIndicator,
  Grid: RangeCalendarGrid,
  GridBody: RangeCalendarGridBody,
  GridHeader: RangeCalendarGridHeader,
  Header: RangeCalendarHeader,
  HeaderCell: RangeCalendarHeaderCell,
  Heading: RangeCalendarHeading,
  NavButton: RangeCalendarNavButton,
  Root: RangeCalendarRoot,
  YearPickerCell: CalendarYearPickerCell,
  YearPickerGrid: CalendarYearPickerGrid,
  YearPickerGridBody: CalendarYearPickerGridBody,
  YearPickerTrigger: CalendarYearPickerTrigger,
  YearPickerTriggerHeading: CalendarYearPickerTriggerHeading,
  YearPickerTriggerIndicator: CalendarYearPickerTriggerIndicator,
});

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  RangeCalendarCell,
  RangeCalendarCellIndicator,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHeader,
  RangeCalendarHeader,
  RangeCalendarHeaderCell,
  RangeCalendarHeading,
  RangeCalendarNavButton,
  RangeCalendarRoot,
};

export type {
  RangeCalendarCellIndicatorProps,
  RangeCalendarCellProps,
  RangeCalendarCellSlotProps,
  RangeCalendarGridBodyProps,
  RangeCalendarGridBodySlotProps,
  RangeCalendarGridHeaderProps,
  RangeCalendarGridHeaderSlotProps,
  RangeCalendarGridProps,
  RangeCalendarHeaderCellProps,
  RangeCalendarHeaderProps,
  RangeCalendarHeadingProps,
  RangeCalendarNavButtonProps,
  RangeCalendarRootProps,
  RangeCalendarRootProps as RangeCalendarProps,
  RangeCalendarRootSlotProps,
} from "./range-calendar.types";

/* -------------------------------------------------------------------------------------------------
 * Contexts
 * -----------------------------------------------------------------------------------------------*/
export {
  provideRangeCalendarContext,
  provideRangeCalendarOwnerContext,
  useRangeCalendarContext,
  useRangeCalendarOwnerContext,
} from "./range-calendar.context";

export type {
  RangeCalendarContext,
  RangeCalendarOwnedProps,
  RangeCalendarOwnerContext,
} from "./range-calendar.context";

/* -------------------------------------------------------------------------------------------------
 * Composables
 * -----------------------------------------------------------------------------------------------*/
export type { AnyCalendarState, DateRange } from "../../composables/use-calendar";

export type { CalendarHeadingFormatOptions } from "../../composables/use-calendar-heading";

export type { RangeCalendarCommitBehavior } from "../../composables/use-range-calendar";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { rangeCalendarVariants } from "@ropav/styles";

export type { RangeCalendarVariants } from "@ropav/styles";
