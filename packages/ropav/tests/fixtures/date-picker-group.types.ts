import type { UseDatePickerGroupReturn } from "@/composables/use-date-picker-group";

export interface DatePickerGroupHostProps {
  /** One entry per segment; true means that segment is still empty. */
  placeholders?: boolean[];
  disableArrowNavigation?: boolean;
  setOpen?: (open: boolean) => void;
  onReady?: (group: UseDatePickerGroupReturn) => void;
}

export interface DatePickerGroupHarnessProps extends DatePickerGroupHostProps {
  locale?: string;
}
