import type {CollectionKey} from "../../composables/use-collection";
import type {
  ComboBoxFilter,
  ComboBoxMenuTrigger,
  ComboBoxValidationValue,
} from "../../composables/use-combo-box-state";
import type {
  ValidationBehavior,
  ValidationFunction,
} from "../../composables/use-form-validation-state";
import type {
  SelectSelectionMode,
  SelectedItem,
  SelectedValue,
} from "../../composables/use-select-state";
import type {DisabledBehavior} from "../../composables/use-selection-manager";
import type {Placement} from "../../utils/position";

/**
 * A combo box is a text field that filters a list of options, and the text is part of the value.
 *
 * `fullWidth` is declared as a plain `boolean` rather than through the variants type. The SFC
 * compiler cannot resolve an imported indexed-access type into a runtime prop type, and without
 * `type: Boolean` Vue never casts a valueless attribute — `<ComboBox full-width>` would arrive as
 * `""` and read as falsy, so the modifier would silently never apply.
 */
export interface ComboBoxRootProps<T = unknown> {
  class?: string;
  /**
   * The options, as data. **Required.**
   *
   * The React build reads its options out of a hidden render pass of its children. Rendering is
   * what creates DOM in vapor, so there is no such pass — and the options only exist in the DOM
   * while the popover is open. Everything a closed combo box has to answer for reads this instead:
   * the text the field shows for the chosen option, the list the filter runs over, and the key the
   * form submits. Required rather than optional so leaving it out is a type error instead of a
   * combo box that quietly shows an empty field over a value it holds.
   */
  items: readonly T[];
  /** An item's key. Defaults to its own `id`, then `key`, then its index. */
  itemKey?: (item: T, index: number) => CollectionKey;
  /** Text shown for an item in the field, and matched on by the filter. Defaults to its text. */
  itemTextValue?: (item: T) => string | undefined;
  /** Whether an item cannot be chosen. Merges with `disabledKeys`. */
  itemDisabled?: (item: T) => boolean;
  /** Whether one or several options can be chosen. @default "single" */
  selectionMode?: SelectSelectionMode;
  /** The chosen key, or keys when multiple. Controlled. */
  value?: SelectedValue;
  /** The key(s) the combo box starts on. */
  defaultValue?: SelectedValue;
  /** Text in the field. Controlled. */
  inputValue?: string;
  /** Text the field starts with. Defaults to the chosen option's own text. */
  defaultInputValue?: string;
  /** What has to happen for the popover to appear. @default "focus" */
  menuTrigger?: ComboBoxMenuTrigger;
  /**
   * Whether an option's text matches what has been typed.
   *
   * Absent means a locale-aware "contains", which is what the React build defaults to. An explicit
   * `null` means the caller narrows `items` itself — an asynchronous search, or a list already
   * sliced — and nothing filters a second time.
   */
  defaultFilter?: ComboBoxFilter | null;
  /** Whether text matching no option may stand as the value. */
  allowsCustomValue?: boolean;
  /** Whether the popover may open with no options in it. */
  allowsEmptyCollection?: boolean;
  /** Whether leaving the field commits what is in it and closes the popover. @default true */
  shouldCloseOnBlur?: boolean;
  /** Keys that cannot be chosen. */
  disabledKeys?: Iterable<CollectionKey>;
  /** Whether a disabled key is also unfocusable. @default "all" */
  disabledBehavior?: DisabledBehavior;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  /** Controlled validity. Present at all — `true` or `false` — shadows `validate`. */
  isInvalid?: boolean;
  validate?: ValidationFunction<ComboBoxValidationValue>;
  /** @default "native" */
  validationBehavior?: ValidationBehavior;
  /** Name the value is submitted under. */
  name?: string;
  /** Id of the `<form>` the field belongs to. */
  form?: string;
  /**
   * Whether the form carries the chosen key or the text in the field. @default "key"
   *
   * Forced to `"text"` by `allowsCustomValue`, where text matching no option is the whole point
   * and there is no key to send.
   */
  formValue?: "key" | "text";
  /** Whether the arrow keys wrap around the ends of the list. */
  shouldFocusWrap?: boolean;
  /** Id of the field itself, which the label points `for` at. */
  id?: string;
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  inputMode?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  /** Whether the combo box stretches to fill its container. */
  fullWidth?: boolean;
  /** Visual variant the `Input` inside picks up. @default "primary" */
  variant?: "primary" | "secondary";
}

export interface ComboBoxRootEmits {
  change: [value: SelectedValue];
  "update:value": [value: SelectedValue];
  inputChange: [value: string];
  "update:inputValue": [value: string];
  /** The popover opened or closed, along with what caused it. */
  openChange: [isOpen: boolean, menuTrigger?: ComboBoxMenuTrigger];
  focusChange: [isFocused: boolean];
}

export interface ComboBoxRootSlotProps {
  isOpen: boolean;
  isDisabled: boolean;
  isInvalid: boolean;
  isRequired: boolean;
  isReadOnly: boolean;
}

export interface ComboBoxInputGroupProps {
  class?: string;
}

export interface ComboBoxInputGroupSlotProps {
  isDisabled: boolean;
  isInvalid: boolean;
  isOpen: boolean;
}

export interface ComboBoxTriggerProps {
  class?: string;
}

export interface ComboBoxValueProps {
  class?: string;
  /** Shown when nothing is chosen. */
  placeholder?: string;
}

export interface ComboBoxValueSlotProps<T = unknown> {
  /** The chosen options, each with its datum, key and text. */
  selectedItems: SelectedItem<T>[];
  /** The chosen options' text, joined the way the locale joins a list when several. */
  selectedText: string;
  /** Whether nothing is chosen, so the placeholder is showing. */
  isPlaceholder: boolean;
  /** The placeholder, when one was given. */
  placeholder: string | undefined;
}

export interface ComboBoxPopoverProps {
  class?: string;
  /** @default "bottom" */
  placement?: Placement;
  /** Distance from the field, in pixels. @default 8 */
  offset?: number;
  /** Shift along the field's edge, in pixels. */
  crossOffset?: number;
  /** Whether the popover may flip to the other side when it does not fit. */
  shouldFlip?: boolean;
  containerPadding?: number;
  arrowBoundaryOffset?: number;
  isKeyboardDismissDisabled?: boolean;
}
