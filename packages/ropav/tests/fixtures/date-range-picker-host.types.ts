import type {DateRange} from "@/composables/use-calendar";
import type {UseDateRangePickerReturn} from "@/composables/use-date-range-picker";
import type {DateRangePickerState} from "@/composables/use-date-range-picker-state";
import type {DateValue} from "@internationalized/date";

export interface DateRangePickerHostProps {
  id?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  locale?: string;
  /** Renders a visible label, so the picker's `aria-labelledby` has something to point at. */
  withLabel?: boolean;
  onFocusChange?: (isFocused: boolean) => void;
  onReady?: (ready: {picker: UseDateRangePickerReturn; state: DateRangePickerState}) => void;
}
