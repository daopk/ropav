import type {SelectedValue} from "@/composables/use-select-state";

/** The datum every select fixture builds its options from. */
export interface SelectFixtureItem {
  id: string;
  name: string;
  email?: string;
  isDisabled?: boolean;
}

export interface SelectFixtureProps {
  items?: SelectFixtureItem[];
  selectionMode?: "single" | "multiple";
  value?: SelectedValue;
  defaultValue?: SelectedValue;
  isOpen?: boolean;
  defaultOpen?: boolean;
  isDisabled?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  name?: string;
  placeholder?: string;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  /** Whether a `Label` is rendered, since the trigger is named by it. */
  withLabel?: boolean;
  /** Whether a `Description` is rendered under the trigger. */
  withDescription?: boolean;
  /** Whether a `FieldError` is rendered, which only shows once the select is invalid. */
  withFieldError?: boolean;
  /** Whether the value renders through its slot rather than showing plain text. */
  withCustomValue?: boolean;
  /** Whether the indicator is given an icon of its own. */
  withCustomIndicator?: boolean;
  onChange?: (value: SelectedValue) => void;
  onOpenChange?: (isOpen: boolean) => void;
}
