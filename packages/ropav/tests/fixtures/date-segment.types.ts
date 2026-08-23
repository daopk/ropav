import type { DateFieldState, DateSegment } from "@/composables/use-date-field-state";
import type { UseDatePickerGroupReturn } from "@/composables/use-date-picker-group";
import type { Granularity, MaxGranularity } from "@/utils/date-format";
import type { FocusManager } from "@/utils/focus";
import type { DateValue } from "@internationalized/date";

export interface DateSegmentPartProps {
  segment: DateSegment;
  state: DateFieldState;
  focusManager: FocusManager;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
}

/** The pieces a test reads once the field is mounted. */
export interface DateSegmentReady {
  state: DateFieldState;
  group: UseDatePickerGroupReturn;
}

export interface DateSegmentHostProps {
  value?: DateValue | null;
  defaultValue?: DateValue | null;
  granularity?: Granularity;
  maxGranularity?: MaxGranularity;
  minValue?: DateValue | null;
  maxValue?: DateValue | null;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  onChange?: (value: DateValue | null) => void;
  onReady?: (ready: DateSegmentReady) => void;
}

export interface DateSegmentHarnessProps extends DateSegmentHostProps {
  locale?: string;
}
