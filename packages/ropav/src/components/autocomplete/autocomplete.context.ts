import type {CollectionKey} from "../../composables/use-collection";
import type {UseSelectReturn} from "../../composables/use-select";
import type {SelectedItem, UseSelectStateReturn} from "../../composables/use-select-state";
import type {autocompleteVariants} from "@ropav/styles";
import type {ComputedRef, ShallowRef} from "vue";

import {createContext} from "../../utils/create-context";

export interface AutocompleteContext {
  slots: ComputedRef<ReturnType<typeof autocompleteVariants>>;
  state: UseSelectStateReturn<unknown>;
  select: UseSelectReturn;
  /** The chosen options, with the datum each was built from. */
  selectedItems: ComputedRef<SelectedItem<unknown>[]>;
  /** The chosen options' text, joined the way the locale joins a list when several. */
  selectedText: ComputedRef<string>;
  /** What the trigger shows when nothing is chosen, already resolved to the localized default. */
  placeholder: ComputedRef<string>;
  isDisabled: ComputedRef<boolean>;
  /**
   * The group the trigger renders, which the popover is measured and positioned against.
   *
   * Not the chevron button, even though that button is the accessible trigger: the popover lines
   * up with the whole field, and `--trigger-width` has to be the field's width.
   */
  triggerElement: ShallowRef<HTMLElement | null>;
  setTriggerElement: (element: HTMLElement | null) => void;
  /** So a press on the clear button is not also read as a press on the trigger around it. */
  clearButtonElement: ShallowRef<HTMLElement | null>;
  setClearButtonElement: (element: HTMLElement | null) => void;
  onClear: () => void;
  /** The options to filter, as data — the same list the root builds its collection from. */
  items: ComputedRef<readonly unknown[]>;
  itemKey?: (item: unknown, index: number) => CollectionKey;
  itemTextValue?: (item: unknown) => string | undefined;
  itemDisabled?: (item: unknown) => boolean;
}

/**
 * Strict: every part of an autocomplete reads the state the root holds, so one rendered outside a
 * root would show a value nobody owns and a trigger that opens nothing.
 */
export const [useAutocompleteContext, provideAutocompleteContext] =
  createContext<AutocompleteContext>({
    name: "AutocompleteContext",
  });
