import CalendarYearPickerCell from "./calendar-year-picker-cell.vue";
import CalendarYearPickerGridBody from "./calendar-year-picker-grid-body.vue";
import CalendarYearPickerGrid from "./calendar-year-picker-grid.vue";
import CalendarYearPickerTriggerHeading from "./calendar-year-picker-trigger-heading.vue";
import CalendarYearPickerTriggerIndicator from "./calendar-year-picker-trigger-indicator.vue";
import CalendarYearPickerTrigger from "./calendar-year-picker-trigger.vue";

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
export { provideYearPickerContext, useYearPickerContext } from "./calendar-year-picker.context";

export type { YearPickerContext } from "./calendar-year-picker.context";

/* -------------------------------------------------------------------------------------------------
 * Composables
 * -----------------------------------------------------------------------------------------------*/
export type { CalendarHeadingFormatOptions } from "../../composables/use-calendar-heading";

export type { CalendarYearPickerFormatOptions } from "../../composables/use-calendar-year-picker";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export { calendarYearPickerVariants } from "@ropav/styles";

export type { CalendarYearPickerVariants } from "@ropav/styles";
