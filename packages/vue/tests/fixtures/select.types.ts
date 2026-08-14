import type {ValidationBehavior, ValidationFunction} from "@/composables/use-form-validation-state";
import type {UseSelectReturn} from "@/composables/use-select";
import type {
  SelectSelectionMode,
  SelectValue,
  UseSelectStateReturn,
} from "@/composables/use-select-state";

/** The datum every select fixture builds its options from. */
export interface SelectFixtureItem {
  id: string;
  name: string;
  isDisabled?: boolean;
}

export interface SelectStateHostProps {
  items?: SelectFixtureItem[];
  selectionMode?: SelectSelectionMode;
  value?: SelectValue;
  defaultValue?: SelectValue;
  isOpen?: boolean;
  defaultOpen?: boolean;
  shouldCloseOnSelect?: boolean;
  allowsEmptyCollection?: boolean;
  disabledKeys?: Iterable<string>;
  isInvalid?: boolean;
  validate?: ValidationFunction<SelectValue>;
  validationBehavior?: ValidationBehavior;
  name?: string;
  onChange?: (value: SelectValue) => void;
  onOpenChange?: (isOpen: boolean) => void;
  /** Hands the live state back to the test. */
  onReady?: (state: UseSelectStateReturn<SelectFixtureItem>) => void;
}

export interface SelectHostProps extends SelectStateHostProps {
  isDisabled?: boolean;
  isRequired?: boolean;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  onFocusChange?: (isFocused: boolean) => void;
  /** Hands the live behaviour layer back to the test. */
  onSelectReady?: (select: UseSelectReturn) => void;
}
