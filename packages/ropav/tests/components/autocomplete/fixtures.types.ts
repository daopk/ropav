import type { SelectedValue } from "@/composables/use-select-state";

/** The datum every autocomplete fixture builds its options from. */
export interface AutocompleteFixtureItem {
  id: string;
  name: string;
  isDisabled?: boolean;
}

export interface AutocompleteFixtureProps {
  /** A class per part, so each one can be shown to merge rather than replace its BEM class. */
  rootClass?: string;
  triggerClass?: string;
  valueClass?: string;
  indicatorClass?: string;
  popoverClass?: string;
  clearButtonClass?: string;
  items?: AutocompleteFixtureItem[];
  /** Options the filter is handed directly, which takes the filtering over from `filter`. */
  filterItems?: AutocompleteFixtureItem[];
  selectionMode?: "single" | "multiple";
  value?: SelectedValue;
  defaultValue?: SelectedValue;
  isOpen?: boolean;
  defaultOpen?: boolean;
  isDisabled?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  /** Whether the popover may open with no options in it, as an async list needs. */
  allowsEmptyCollection?: boolean;
  disabledKeys?: string[];
  name?: string;
  /** Id of the form the hidden control belongs to, wired by attribute. */
  form?: string;
  placeholder?: string;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  /** Whether the search field narrows the options at all. */
  withFilter?: boolean;
  /** Whether a `Label` is rendered, since the trigger is named by it. */
  withLabel?: boolean;
  withDescription?: boolean;
  withFieldError?: boolean;
  withClearButton?: boolean;
  /** Whether the value renders through its slot rather than showing plain text. */
  withCustomValue?: boolean;
  /** Whether the indicator is given an icon of its own. */
  withCustomIndicator?: boolean;
  /** Whether the listbox says something when nothing matches. */
  withEmptyState?: boolean;
  /** Whether the whole thing sits in a `<form>` with a real reset button. */
  withForm?: boolean;
  onChange?: (value: SelectedValue) => void;
  onOpenChange?: (isOpen: boolean) => void;
  onClear?: () => void;
}
