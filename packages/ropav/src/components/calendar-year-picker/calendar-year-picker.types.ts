import type { CalendarHeadingFormatOptions } from "../../composables/use-calendar-heading";
import type { CalendarYearPickerFormatOptions } from "../../composables/use-calendar-year-picker";
import type { DateDuration } from "@internationalized/date";

export interface CalendarYearPickerTriggerProps {
  class?: string;
}

export interface CalendarYearPickerTriggerHeadingProps {
  class?: string;
  /** How far past the first visible date this heading describes. */
  offset?: DateDuration;
  /** Overrides the parts the heading is written from. */
  format?: CalendarHeadingFormatOptions;
}

export interface CalendarYearPickerTriggerIndicatorProps {
  class?: string;
}

/** State the trigger and its parts hand their slots, matching React's render props. */
export interface CalendarYearPickerTriggerSlotProps {
  isOpen: boolean;
  monthYear: string;
  toggle: () => void;
}

export interface CalendarYearPickerGridProps {
  class?: string;
  /** How many years to offer. Defaults to the span of the calendar's own bounds. */
  visibleYears?: number;
  /** Overrides the parts each year is written from. */
  format?: CalendarYearPickerFormatOptions;
}

export interface CalendarYearPickerGridBodyProps {
  class?: string;
}

export interface CalendarYearPickerCellProps {
  class?: string;
  year: number;
  /** Keeps the cell out of the tab order. Defaults to whenever it is not the active year. */
  excludeFromTabOrder?: boolean;
}

/** State each year hands its slot, matching React's render props. */
export interface CalendarYearPickerCellSlotProps {
  year: number;
  formattedYear: string;
  isSelected: boolean;
  isCurrentYear: boolean;
  isOpen: boolean;
  selectYear: () => void;
}
