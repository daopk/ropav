import type { UseDatePickerReturn } from "@/composables/use-date-picker";
import type { DatePickerState } from "@/composables/use-date-picker-state";
import type { DateValue } from "@internationalized/date";

export interface DatePickerHostProps {
  id?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  value?: DateValue | null;
  defaultValue?: DateValue | null;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  /** Renders a label, so the picker has something of its own to be named by. */
  withLabel?: boolean;
  locale?: string;
  /** Hands the live hooks back to the test. */
  onReady?: (value: { picker: UseDatePickerReturn; state: DatePickerState }) => void;
}
