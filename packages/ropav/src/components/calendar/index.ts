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
  CalendarRoot as Calendar,
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
  CalendarRootProps as CalendarProps,
  CalendarRootSlotProps as CalendarSlotProps,
} from "./calendar.types";

/* -------------------------------------------------------------------------------------------------
 * Contexts
 * -----------------------------------------------------------------------------------------------*/
/*
 * Published here as well as consumed internally: a range calendar publishes the same state context,
 * and a date picker reaches the calendar's parts without a calendar root of its own.
 */
export {
  provideCalendarOwnerContext,
  provideCalendarStateContext,
  useCalendarOwnerContext,
  useCalendarStateContext,
} from "./calendar.context";

export type {
  CalendarOwnedProps,
  CalendarOwnerContext,
  CalendarStateContext,
} from "./calendar.context";

/* -------------------------------------------------------------------------------------------------
 * Composables
 * -----------------------------------------------------------------------------------------------*/
export type { AnyCalendarState, UseCalendarReturn } from "../../composables/use-calendar";

export type { CalendarHeadingFormatOptions } from "../../composables/use-calendar-heading";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { calendarVariants } from "@ropav/styles";

export type { CalendarVariants } from "@ropav/styles";
