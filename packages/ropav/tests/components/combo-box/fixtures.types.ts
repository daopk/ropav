import type { ComboBoxFilter, ComboBoxMenuTrigger } from "@/composables/use-combo-box-state";
import type { SelectedValue } from "@/composables/use-select-state";

/** The datum every combo box fixture builds its options from. */
export interface ComboBoxFixtureItem {
  id: string;
  name: string;
  isDisabled?: boolean;
}

export interface ComboBoxFixtureProps {
  /** A class per part, so each one can be shown to merge rather than replace its BEM class. */
  rootClass?: string;
  inputGroupClass?: string;
  triggerClass?: string;
  valueClass?: string;
  popoverClass?: string;
  items?: ComboBoxFixtureItem[];
  selectionMode?: "single" | "multiple";
  value?: SelectedValue;
  defaultValue?: SelectedValue;
  inputValue?: string;
  defaultInputValue?: string;
  menuTrigger?: ComboBoxMenuTrigger;
  /** `null` hands the narrowing to the caller, which is what an asynchronous search does. */
  defaultFilter?: ComboBoxFilter | null;
  allowsCustomValue?: boolean;
  /** Whether the popover may open with no options in it, as an async list needs. */
  allowsEmptyCollection?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  disabledKeys?: string[];
  name?: string;
  /** Id of the form the field belongs to, wired by attribute. */
  form?: string;
  /** Whether a form carries the chosen key or the text in the field. */
  formValue?: "key" | "text";
  placeholder?: string;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  /** Whether a `Label` is rendered, since the field is named by it. */
  withLabel?: boolean;
  withDescription?: boolean;
  withFieldError?: boolean;
  /** Whether the chosen options are shown beside the field, as multi-select needs. */
  withValue?: boolean;
  /** Whether the value renders through its slot rather than showing plain text. */
  withCustomValue?: boolean;
  /** Whether the chevron is given an icon of its own. */
  withCustomIndicator?: boolean;
  /** Whether the listbox says something when nothing matches. */
  withEmptyState?: boolean;
  /** Whether the whole thing sits in a `<form>` with a real reset button. */
  withForm?: boolean;
  onChange?: (value: SelectedValue) => void;
  onInputChange?: (value: string) => void;
  onOpenChange?: (isOpen: boolean, menuTrigger?: ComboBoxMenuTrigger) => void;
}
