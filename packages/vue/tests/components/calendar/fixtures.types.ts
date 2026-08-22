import type {
  CalendarSelectionMode,
  CalendarValue,
  PageBehavior,
  SelectionAlignment,
} from "@/composables/use-calendar-state";
import type {DayOfWeek, WeekdayStyle} from "@/utils/calendar";
import type {CalendarDate, DateDuration, DateValue} from "@internationalized/date";

export interface CalendarFixtureProps {
  class?: string;
  id?: string;
  ariaLabel?: string;
  value?: CalendarValue;
  /**
   * Declared as a prop, not left to attribute fallthrough. `vue@3.6.0-rc.5` drops a
   * fallthrough `onUpdate:X` listener when the same call site binds `:X` dynamically, and
   * `:value` is bound on the calendar below — so the emit never reached the test.
   * `onUpdate:yearPickerOpen` needs no such treatment: it pairs with `isYearPickerOpen`,
   * and only a matching name triggers the bug.
   *
   * `update:focusedValue` needs it for the same reason as `update:value` — `:focused-value` is
   * bound below — and it is one of the emits with no React-named callback beside it, so this
   * prop is the only way a test can reach it.
   */
  "onUpdate:value"?: (value: CalendarValue) => void;
  "onUpdate:focusedValue"?: (value: CalendarDate) => void;
  defaultValue?: CalendarValue;
  focusedValue?: DateValue | null;
  defaultFocusedValue?: DateValue | null;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  selectionMode?: CalendarSelectionMode;
  isDateUnavailable?: (date: DateValue) => boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  autoFocus?: boolean;
  visibleDuration?: DateDuration;
  pageBehavior?: PageBehavior;
  selectionAlignment?: SelectionAlignment;
  firstDayOfWeek?: DayOfWeek;
  weeksInMonth?: number;
  weekdayStyle?: WeekdayStyle;
  isYearPickerOpen?: boolean;
  defaultYearPickerOpen?: boolean;
  locale?: string;
  /** Renders the year-picker trigger and grid instead of a plain heading. */
  withYearPicker?: boolean;
  /** Renders a second grid, for the multi-month layout. */
  withSecondMonth?: boolean;
  /** Renders an indicator inside every cell. */
  withCellIndicator?: boolean;
  /** Sets `full-width`-style boolean props as bare attributes, as a caller writes them. */
  attributeForm?: boolean;
}
