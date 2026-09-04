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
  RangeCalendarRoot as RangeCalendar,
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
  RangeCalendarRootProps as RangeCalendarProps,
  RangeCalendarRootSlotProps as RangeCalendarSlotProps,
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
