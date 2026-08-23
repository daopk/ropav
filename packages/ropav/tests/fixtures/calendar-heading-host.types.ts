import type {CalendarHeadingFormatOptions} from "@/composables/use-calendar-heading";
import type {CalendarState} from "@/composables/use-calendar-state";
import type {
  CalendarYearPickerFormatOptions,
  UseCalendarYearPickerReturn,
} from "@/composables/use-calendar-year-picker";
import type {DateDuration, DateValue} from "@internationalized/date";
import type {ComputedRef} from "vue";

export interface CalendarHeadingHostProps {
  defaultFocusedValue?: DateValue | null;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  visibleDuration?: DateDuration;
  /** How far past the first visible date the heading describes. */
  offset?: DateDuration;
  format?: CalendarHeadingFormatOptions;
  visibleYears?: number;
  yearFormat?: CalendarYearPickerFormatOptions;
  locale?: string;
  /** Hands the live heading and year picker back to the test. */
  onReady?: (value: {
    heading: ComputedRef<string>;
    state: CalendarState;
    years: UseCalendarYearPickerReturn;
  }) => void;
}
