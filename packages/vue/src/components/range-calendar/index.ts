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
// Part order mirrors the DOM order of a calendar, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const RangeCalendar = Object.assign(RangeCalendarRoot, {
  Root: RangeCalendarRoot,
  Header: RangeCalendarHeader,
  Heading: RangeCalendarHeading,
  NavButton: RangeCalendarNavButton,
  Grid: RangeCalendarGrid,
  GridHeader: RangeCalendarGridHeader,
  GridBody: RangeCalendarGridBody,
  HeaderCell: RangeCalendarHeaderCell,
  Cell: RangeCalendarCell,
  CellIndicator: RangeCalendarCellIndicator,
  YearPickerTrigger: CalendarYearPickerTrigger,
  YearPickerTriggerHeading: CalendarYearPickerTriggerHeading,
  YearPickerTriggerIndicator: CalendarYearPickerTriggerIndicator,
  YearPickerGrid: CalendarYearPickerGrid,
  YearPickerGridBody: CalendarYearPickerGridBody,
  YearPickerCell: CalendarYearPickerCell,
});
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

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
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {rangeCalendarVariants} from "@heroui/styles";

export type {RangeCalendarVariants} from "@heroui/styles";
