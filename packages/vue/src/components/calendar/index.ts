import {
  CalendarYearPickerCell,
  CalendarYearPickerGrid,
  CalendarYearPickerGridBody,
  CalendarYearPickerTrigger,
  CalendarYearPickerTriggerHeading,
  CalendarYearPickerTriggerIndicator,
} from "../calendar-year-picker";

import CalendarCellIndicator from "./calendar-cell-indicator.vue";
import CalendarCell from "./calendar-cell.vue";
import CalendarGridBody from "./calendar-grid-body.vue";
import CalendarGridHeader from "./calendar-grid-header.vue";
import CalendarGrid from "./calendar-grid.vue";
import CalendarHeaderCell from "./calendar-header-cell.vue";
import CalendarHeader from "./calendar-header.vue";
import CalendarHeading from "./calendar-heading.vue";
import CalendarNavButton from "./calendar-nav-button.vue";
import CalendarRoot from "./calendar-root.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Part order mirrors the DOM order of a calendar, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const Calendar = Object.assign(CalendarRoot, {
  Root: CalendarRoot,
  Header: CalendarHeader,
  Heading: CalendarHeading,
  NavButton: CalendarNavButton,
  Grid: CalendarGrid,
  GridHeader: CalendarGridHeader,
  GridBody: CalendarGridBody,
  HeaderCell: CalendarHeaderCell,
  Cell: CalendarCell,
  CellIndicator: CalendarCellIndicator,
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
  CalendarCell,
  CalendarCellIndicator,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeader,
  CalendarHeaderCell,
  CalendarHeading,
  CalendarNavButton,
  CalendarRoot,
};

export type {
  CalendarCellIndicatorProps,
  CalendarCellProps,
  CalendarCellSlotProps,
  CalendarGridBodyProps,
  CalendarGridBodySlotProps,
  CalendarGridHeaderProps,
  CalendarGridHeaderSlotProps,
  CalendarGridProps,
  CalendarHeaderCellProps,
  CalendarHeaderProps,
  CalendarHeadingProps,
  CalendarNavButtonProps,
  CalendarRootProps,
  CalendarRootProps as CalendarProps,
  CalendarRootSlotProps,
} from "./calendar.types";

/* -------------------------------------------------------------------------------------------------
 * Contexts
 * -----------------------------------------------------------------------------------------------*/
/*
 * Published here as well as consumed internally: a range calendar publishes the same state context,
 * and a date picker reaches the calendar's parts without a calendar root of its own.
 */
export {provideCalendarStateContext, useCalendarStateContext} from "./calendar.context";

export type {CalendarStateContext} from "./calendar.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {calendarVariants} from "@heroui/styles";

export type {CalendarVariants} from "@heroui/styles";
