import type {
  ComboBoxFilter,
  ComboBoxMenuTrigger,
  ComboBoxValidationValue,
  UseComboBoxStateReturn,
} from "@/composables/use-combo-box-state";
import type {ValidationBehavior, ValidationFunction} from "@/composables/use-form-validation-state";
import type {SelectSelectionMode, SelectedValue} from "@/composables/use-select-state";

/** The datum every combo box fixture builds its options from. */
export interface ComboBoxFixtureItem {
  id: string;
  name: string;
  isDisabled?: boolean;
}

export interface ComboBoxStateHostProps {
  items?: ComboBoxFixtureItem[];
  selectionMode?: SelectSelectionMode;
  value?: SelectedValue;
  defaultValue?: SelectedValue;
  inputValue?: string;
  defaultInputValue?: string;
  menuTrigger?: ComboBoxMenuTrigger;
  /** `null` hands the filtering to the caller, which is what an asynchronous search does. */
  defaultFilter?: ComboBoxFilter | null;
  allowsCustomValue?: boolean;
  allowsEmptyCollection?: boolean;
  shouldCloseOnBlur?: boolean;
  disabledKeys?: Iterable<string>;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  validate?: ValidationFunction<ComboBoxValidationValue>;
  validationBehavior?: ValidationBehavior;
  name?: string;
  onChange?: (value: SelectedValue) => void;
  onInputChange?: (value: string) => void;
  onOpenChange?: (isOpen: boolean, menuTrigger?: ComboBoxMenuTrigger) => void;
  /** Hands the live state back to the test. */
  onReady?: (state: UseComboBoxStateReturn<ComboBoxFixtureItem>) => void;
}
