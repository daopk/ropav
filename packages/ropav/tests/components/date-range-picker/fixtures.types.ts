import type { DateRange } from "@/composables/use-calendar";
import type { PageBehavior } from "@/composables/use-calendar-state";
import type { ValidationBehavior } from "@/composables/use-form-validation-state";
import type { DayOfWeek } from "@/utils/calendar";
import type { Granularity } from "@/utils/date-format";
import type { DateValue } from "@internationalized/date";

export interface DateRangePickerFixtureProps {
  class?: string;
  id?: string;
  ariaLabel?: string;
  ariaDescribedby?: string;
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  placeholderValue?: DateValue | null;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  isDateUnavailable?: (date: DateValue) => boolean;
  allowsNonContiguousRanges?: boolean;
  granularity?: Granularity;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  validate?: (value: DateRange | null) => string | string[] | true | null | undefined;
  validationBehavior?: ValidationBehavior;
  startName?: string;
  endName?: string;
  autoFocus?: boolean;
  shouldCloseOnSelect?: boolean | (() => boolean);
  isOpen?: boolean;
  defaultOpen?: boolean;
  firstDayOfWeek?: DayOfWeek;
  pageBehavior?: PageBehavior;
  locale?: string;
  onValueChange?: (value: DateRange | null) => void;
  onOpenChange?: (isOpen: boolean) => void;
  onFocusChange?: (isFocused: boolean) => void;
  /** Renders a visible label, so the picker's `aria-labelledby` has something to point at. */
  label?: string;
  description?: string;
  /** Renders an error message, which is what a revealed validation failure is read from. */
  errorMessage?: string;
  /** Renders the trigger with content of its own instead of the default indicator. */
  customIndicator?: boolean;
  /** Renders the separator with content of its own instead of the default dash. */
  customSeparator?: boolean;
  /** Leaves the `slot` off one of the two inputs, which is markup a range picker cannot resolve. */
  missingSlot?: boolean;
  /** Sets boolean props as bare attributes, as a caller writes them. */
  attributeForm?: boolean;
}
