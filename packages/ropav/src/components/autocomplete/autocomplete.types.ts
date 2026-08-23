import type { SelectedItem, SelectedValue } from "../../composables/use-select-state";
import type { Placement } from "../../utils/position";
import type { SelectRootProps } from "../select/select.types";
import type { AutocompleteVariants } from "@ropav/styles";

/**
 * An autocomplete is a select whose options can be narrowed by typing, so it takes every prop a
 * select takes — including the required `items`, which is what answers for the options while the
 * popover is shut.
 *
 * `fullWidth` is redeclared as a plain `boolean` rather than through the variants type. The SFC
 * compiler cannot resolve an imported indexed-access type into a runtime prop type, and without
 * `type: Boolean` Vue never casts a valueless attribute — `<Autocomplete full-width>` would
 * arrive as `""` and read as falsy, so the modifier would silently never apply.
 */
export interface AutocompleteRootProps<T = unknown> extends SelectRootProps<T> {
  /** Visual variant. @default "primary" */
  variant?: AutocompleteVariants["variant"];
  /** Whether the autocomplete stretches to fill its container. */
  fullWidth?: boolean;
}

export interface AutocompleteRootEmits {
  change: [value: SelectedValue];
  "update:value": [value: SelectedValue];
  openChange: [isOpen: boolean];
  "update:isOpen": [isOpen: boolean];
  focusChange: [isFocused: boolean];
  /**
   * The clear button emptied the selection.
   *
   * An emit rather than a prop even though the React build takes an `onClear` callback: Vue routes
   * an `onClear` listener to an emit of this name of its own accord, so declaring both would give
   * the same handler two ways in and fire it twice.
   */
  clear: [];
}

export interface AutocompleteRootSlotProps {
  isOpen: boolean;
  isDisabled: boolean;
  isInvalid: boolean;
  isRequired: boolean;
  isFocused: boolean;
}

export interface AutocompleteTriggerProps {
  class?: string;
  /** Whether this trigger in particular is disabled. Falls back to the autocomplete's own state. */
  isDisabled?: boolean;
}

export interface AutocompleteTriggerSlotProps {
  isHovered: boolean;
  isFocusWithin: boolean;
  isDisabled: boolean;
  isInvalid: boolean;
}

export interface AutocompleteValueProps {
  class?: string;
}

export interface AutocompleteValueSlotProps<T = unknown> {
  /** The chosen options, each with its datum, key and text. */
  selectedItems: SelectedItem<T>[];
  /** The chosen options' text, joined the way the locale joins a list when several. */
  selectedText: string;
  /** Whether nothing is chosen, so the placeholder is showing. */
  isPlaceholder: boolean;
  /** The placeholder, resolved to the localized default when none was given. */
  placeholder: string;
}

export interface AutocompleteIndicatorProps {
  class?: string;
}

export interface AutocompleteClearButtonProps {
  class?: string;
}

export interface AutocompletePopoverProps {
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

export interface AutocompleteFilterProps<T = unknown> {
  /**
   * Whether an option's text matches what has been typed. Without one nothing is filtered.
   *
   * `useFilter` is where the three usual answers come from, and `contains` is what the React
   * build's stories pass.
   */
  filter?: (textValue: string, inputValue: string) => boolean;
  /**
   * The options to show, already narrowed. Takes the filtering over entirely.
   *
   * This is the seam an asynchronous search or a virtualized list needs: the caller fetches or
   * slices, and `filter` is then never consulted.
   */
  items?: readonly T[];
  /** Text in the search field. Present at all puts the caller in charge of it. */
  inputValue?: string;
  /** Text the search field starts with. */
  defaultInputValue?: string;
  /** Whether typing stops moving focus onto the first matching option. */
  disableAutoFocusFirst?: boolean;
  /**
   * Whether the arrows move real focus into the options instead of a nominal one.
   *
   * Off is the whole arrangement: the caret stays in the search field and the field names the
   * focused option, so typing and choosing can go on in one breath.
   */
  disableVirtualFocus?: boolean;
}

export interface AutocompleteFilterSlotProps<T = unknown> {
  /** What has been typed so far. */
  inputValue: string;
  /** The options that match it, which is what the listbox below should render. */
  items: readonly T[];
}

export interface AutocompleteFilterEmits {
  inputChange: [value: string];
  "update:inputValue": [value: string];
}
