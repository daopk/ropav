<script setup lang="ts" vapor generic="T">
import type { UseListKeyboardReturn } from "../../composables/use-list-keyboard";
import type { CollectionSelection } from "../../composables/use-selection-manager";
import type { AutocompleteFilterProps, AutocompleteFilterSlotProps } from "./autocomplete.types";

import { computed, shallowRef } from "vue";

import {
  provideAutocompleteInputContext,
  useAutocomplete,
} from "../../composables/use-autocomplete";
import { useCollection } from "../../composables/use-collection";
import { useControllableState } from "../../composables/use-controllable-state";
import { defaultItemTextValue } from "../../composables/use-select-state";
import { useSelectionManager } from "../../composables/use-selection-manager";
import { createListCollection } from "../../utils/virtualizer-collection";
import { provideListBoxStateContext } from "../list-box";

import { useAutocompleteContext } from "./autocomplete.context";

// `disableAutoFocusFirst` and `disableVirtualFocus` declare an explicit `undefined` default so an
// absent prop stays absent rather than reading as an explicit `false`.
const props = withDefaults(defineProps<AutocompleteFilterProps<T>>(), {
  disableAutoFocusFirst: undefined,
  disableVirtualFocus: undefined,
});

const emit = defineEmits<{
  inputChange: [value: string];
  "update:inputValue": [value: string];
}>();

defineSlots<{ default?: (props: AutocompleteFilterSlotProps<T>) => unknown }>();

const root = useAutocompleteContext();

/**
 * The text belongs here rather than to the search field below.
 *
 * The field is one way of typing it — a caller could put a plain input there instead — and the
 * options that match it have to be known before either of them renders.
 */
const { setState: setInputValue, state: inputValue } = useControllableState<string>({
  defaultValue: props.defaultInputValue ?? "",
  onValueChange: (value) => {
    emit("inputChange", value);
    emit("update:inputValue", value);
  },
  value: () => props.inputValue,
});

const textValueOf = (item: T) => root.itemTextValue?.(item) ?? defaultItemTextValue(item) ?? "";

/**
 * The options that survive what has been typed.
 *
 * Given `items`, the caller has already narrowed them and `filter` is never consulted — that is
 * the seam an asynchronous search or a virtualized list needs. Given neither, nothing is filtered,
 * which matches the React build: its primitive only filters when handed a predicate.
 */
const filteredItems = computed<readonly T[]>(() => {
  if (props.items) return props.items;

  const filter = props.filter;
  const text = inputValue.value;

  if (!filter || text === "") return root.items.value as readonly T[];

  return (root.items.value as readonly T[]).filter((item) => filter(textValueOf(item), text));
});

/**
 * A second collection over the narrowed options, which the listbox below navigates instead of the
 * root's — the counterpart of `selectionManager.withCollection()` upstream.
 *
 * The trigger keeps reading the root's, so the value on screen survives typing that filters the
 * chosen option out of sight.
 */
const filteredSource = computed(() =>
  createListCollection({
    getKey: root.itemKey,
    getTextValue: root.itemTextValue ?? defaultItemTextValue,
    isDisabled: root.itemDisabled,
    items: filteredItems.value,
  }),
);

const collection = useCollection({ source: () => filteredSource.value });

/**
 * A second selection over the narrowed options, driven by the root's and writing back into it.
 *
 * Controlled on purpose: the root is the one that holds the value, submits it and validates it, so
 * this one only translates a press on a filtered option into a change on the real selection.
 *
 * Focus is deliberately *not* shared with the root's manager. Nothing reads the root's focused key
 * while this is mounted, and routing writes through it would put them through the root
 * collection's validation — which refuses any key the caller narrowed to but did not also list on
 * the root, and so would leave the arrows silently doing nothing.
 */
const selection = useSelectionManager({
  collection,
  disabledBehavior: root.state.selection.disabledBehavior,
  disabledKeys: root.state.selection.disabledKeys,
  // A single autocomplete never lets go of what it has: pressing the chosen option keeps it.
  disallowEmptySelection: () => root.state.selectionMode.value === "single",
  onSelectionChange: (keys: CollectionSelection) => {
    root.state.selection.setSelectedKeys(keys === "all" ? collection.orderedKeys() : keys);
  },
  selectedKeys: () => root.state.selection.selectedKeys.value,
  selectionMode: () => root.state.selectionMode.value,
});

/**
 * The keyboard behaviour of the listbox below, once it exists.
 *
 * Only the listbox can build it — it is the one that knows its own element and its own layout, so
 * paging works the same whether the options are all rendered or windowed — and it hands it back
 * here because the keys are pressed in the input, not in it.
 */
const keyboard = shallowRef<UseListKeyboardReturn | null>(null);

const inputElement = shallowRef<HTMLInputElement | null>(null);

const autocomplete = useAutocomplete({
  collection,
  collectionId: () => root.select.listId.value,
  defaultInputValue: props.defaultInputValue,
  disableAutoFocusFirst: () => props.disableAutoFocusFirst,
  disableVirtualFocus: () => props.disableVirtualFocus,
  inputElement,
  inputValue: () => inputValue.value,
  keyboard,
  onInputChange: setInputValue,
  selection,
});

/**
 * Provided again, shadowing the root's, so the listbox in this slot runs on the narrowed options.
 *
 * `autoFocus` is off because the search field is what takes focus when the popover appears, and
 * `shouldUseVirtualFocus` is what keeps it: the arrows move a nominal focus over the options while
 * the caret stays in the text being typed.
 */
provideListBoxStateContext({
  autoFocus: false,
  collection,
  labelledBy: () => root.select.labelledBy.value,
  listId: () => root.select.listId.value,
  registerKeyboard: (next) => {
    keyboard.value = next;
  },
  selection,
  // The pointer and the keyboard drive the same single choice here, so the highlight follows the
  // mouse — otherwise the next arrow press would jump back to wherever the keyboard left off.
  shouldFocusOnHover: true,
  shouldUseVirtualFocus: () => !props.disableVirtualFocus,
});

provideAutocompleteInputContext({
  inputAttributes: autocomplete.inputAttributes,
  inputValue: autocomplete.inputValue,
  onBlur: autocomplete.onBlur,
  onKeydown: autocomplete.onKeydown,
  onKeyup: autocomplete.onKeyup,
  setInputElement: (element) => {
    inputElement.value = element;
  },
  setInputValue: autocomplete.setInputValue,
});
</script>

<template>
  <slot :input-value="inputValue" :items="filteredItems" />
</template>
