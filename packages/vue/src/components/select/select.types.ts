import type {CollectionKey} from "../../composables/use-collection";
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
import type {SelectVariants} from "@heroui/styles";

export interface SelectRootProps<T = unknown> {
  class?: string;
  /**
   * The options, as data. **Required.**
   *
   * The React build reads its options out of a hidden render pass of its children. Rendering is
   * what creates DOM in vapor, so there is no such pass — and the options only exist in the DOM
   * while the popover is open. Everything a closed select has to answer for reads this instead:
   * the value in the trigger, the options of the hidden native control, typing to choose, and the
   * arrow keys stepping through choices. Required rather than optional so leaving it out is a
   * type error instead of a select that quietly shows a placeholder over a value it holds.
   */
  items: readonly T[];
  /** An item's key. Defaults to its own `id`, then `key`, then its index. */
  itemKey?: (item: T, index: number) => CollectionKey;
  /** Text shown for an item in the trigger, and matched on when typing. Defaults to its text. */
  itemTextValue?: (item: T) => string | undefined;
  /** Whether an item cannot be chosen. Merges with `disabledKeys`. */
  itemDisabled?: (item: T) => boolean;
  /** Whether one or several options can be chosen. @default "single" */
  selectionMode?: SelectSelectionMode;
  /** The chosen key, or keys when multiple. Controlled. */
  value?: SelectedValue;
  /** The key(s) the select starts on. */
  defaultValue?: SelectedValue;
  /** Whether the popover is open. Controlled. */
  isOpen?: boolean;
  /** Whether the popover starts open. */
  defaultOpen?: boolean;
  /** Whether choosing an option closes the popover. @default true when single */
  shouldCloseOnSelect?: boolean;
  /** Whether the popover may open with no options in it. */
  allowsEmptyCollection?: boolean;
  /** Keys that cannot be chosen. */
  disabledKeys?: Iterable<CollectionKey>;
  /** Whether a disabled key is also unfocusable. @default "all" */
  disabledBehavior?: DisabledBehavior;
  isDisabled?: boolean;
  isRequired?: boolean;
  /** Controlled validity. Present at all — `true` or `false` — shadows `validate`. */
  isInvalid?: boolean;
  validate?: ValidationFunction<SelectedValue>;
  /** @default "native" */
  validationBehavior?: ValidationBehavior;
  /** Name of the hidden native control, for form submission. */
  name?: string;
  /** Id of the `<form>` the hidden control belongs to. */
  form?: string;
  /** What the browser may offer to autofill. */
  autoComplete?: string;
  /** Text shown in the trigger when nothing is chosen. Defaults to a localized string. */
  placeholder?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  variant?: SelectVariants["variant"];
  fullWidth?: boolean;
}

export interface SelectRootSlotProps {
  isOpen: boolean;
  isDisabled: boolean;
  isInvalid: boolean;
  isRequired: boolean;
  isFocused: boolean;
}

export interface SelectTriggerProps {
  class?: string;
}

export interface SelectValueProps {
  class?: string;
}

export interface SelectValueSlotProps<T = unknown> {
  /** The chosen options, each with its datum, key and text. */
  selectedItems: SelectedItem<T>[];
  /** The chosen options' text, joined the way the locale joins a list when several. */
  selectedText: string;
  /** Whether nothing is chosen, so the placeholder is showing. */
  isPlaceholder: boolean;
  /** The placeholder, resolved to the localized default when none was given. */
  placeholder: string;
}

export interface SelectIndicatorProps {
  class?: string;
}

export interface SelectPopoverProps {
  class?: string;
  /** @default "bottom" */
  placement?: Placement;
  /** Distance from the trigger, in pixels. @default 8 */
  offset?: number;
  /** Shift along the trigger's edge, in pixels. */
  crossOffset?: number;
  /** Whether the popover may flip to the other side when it does not fit. */
  shouldFlip?: boolean;
  containerPadding?: number;
  arrowBoundaryOffset?: number;
  isKeyboardDismissDisabled?: boolean;
}
