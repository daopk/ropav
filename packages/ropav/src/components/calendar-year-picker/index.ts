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
 * a set of parts a calendar hosts, mirroring `@heroui/react`.
 */
// Part order mirrors the DOM order of a year picker, and `@heroui/react` — not alphabetical.
/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
export const CalendarYearPicker = {
  Trigger: CalendarYearPickerTrigger,
  TriggerHeading: CalendarYearPickerTriggerHeading,
  TriggerIndicator: CalendarYearPickerTriggerIndicator,
  Grid: CalendarYearPickerGrid,
  GridBody: CalendarYearPickerGridBody,
  Cell: CalendarYearPickerCell,
};
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

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
