import CalendarYearPickerCell from "./calendar-year-picker-cell.vue";
import CalendarYearPickerGridBody from "./calendar-year-picker-grid-body.vue";
import CalendarYearPickerGrid from "./calendar-year-picker-grid.vue";
import CalendarYearPickerTriggerHeading from "./calendar-year-picker-trigger-heading.vue";
import CalendarYearPickerTriggerIndicator from "./calendar-year-picker-trigger-indicator.vue";
import CalendarYearPickerTrigger from "./calendar-year-picker-trigger.vue";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
/*
 * A plain object rather than `Object.assign`, because the year picker has no root of its own — it is
 * a set of parts a calendar hosts.
 */
export const CalendarYearPicker = {
  Cell: CalendarYearPickerCell,
  Grid: CalendarYearPickerGrid,
  GridBody: CalendarYearPickerGridBody,
  Trigger: CalendarYearPickerTrigger,
  TriggerHeading: CalendarYearPickerTriggerHeading,
  TriggerIndicator: CalendarYearPickerTriggerIndicator,
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  CalendarYearPickerCell,
  CalendarYearPickerGrid,
  CalendarYearPickerGridBody,
  CalendarYearPickerTrigger,
  CalendarYearPickerTriggerHeading,
  CalendarYearPickerTriggerIndicator,
};

export type {
  CalendarYearPickerCellProps,
  CalendarYearPickerCellSlotProps,
  CalendarYearPickerGridBodyProps,
  CalendarYearPickerGridProps,
  CalendarYearPickerTriggerHeadingProps,
  CalendarYearPickerTriggerIndicatorProps,
  CalendarYearPickerTriggerProps,
  CalendarYearPickerTriggerSlotProps,
} from "./calendar-year-picker.types";

/* -------------------------------------------------------------------------------------------------
 * Contexts
 * -----------------------------------------------------------------------------------------------*/
export {provideYearPickerContext, useYearPickerContext} from "./calendar-year-picker.context";

export type {YearPickerContext} from "./calendar-year-picker.context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {calendarYearPickerVariants} from "@ropav/styles";

export type {CalendarYearPickerVariants} from "@ropav/styles";
