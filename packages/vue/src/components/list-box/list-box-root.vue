<script setup lang="ts" vapor>
import type {ListBoxRootProps} from "./list-box.types";
import type {CollectionKey} from "../../composables/use-collection";
import type {CollectionSelection} from "../../composables/use-selection-manager";

import {listboxVariants} from "@heroui/styles";
import {computed, shallowRef} from "vue";

import {useCollection} from "../../composables/use-collection";
import {useId} from "../../composables/use-id";
import {useListKeyboard} from "../../composables/use-list-keyboard";
import {useSelectionManager} from "../../composables/use-selection-manager";
import {useTypeahead} from "../../composables/use-typeahead";
import {dataAttr} from "../../utils/assertion";

import {provideListBoxContext} from "./list-box.context";

const props = defineProps<ListBoxRootProps>();

const emit = defineEmits<{
  action: [key: CollectionKey];
  selectionChange: [keys: CollectionSelection];
  "update:selectedKeys": [keys: CollectionSelection];
}>();

defineSlots<{default?: () => unknown}>();

const styles = computed(() => listboxVariants({class: props.class, variant: props.variant}));

const listId = useId();
const collectionId = useId();
const element = shallowRef<HTMLElement | null>(null);

const collection = useCollection();

const selection = useSelectionManager({
  collection,
  defaultSelectedKeys: props.defaultSelectedKeys,
  disabledBehavior: () => props.disabledBehavior,
  disabledKeys: () => props.disabledKeys,
  disallowEmptySelection: () => props.disallowEmptySelection,
  onSelectionChange: (keys) => {
    emit("selectionChange", keys);
    emit("update:selectedKeys", keys);
  },
  selectedKeys: () => props.selectedKeys,
  selectionBehavior: () => props.selectionBehavior,
  selectionMode: () => props.selectionMode,
});

const onAction = (key: CollectionKey) => emit("action", key);

const keyboard = useListKeyboard({
  collection,
  element,
  onAction,
  selection,
});

const typeahead = useTypeahead({
  focusedKey: () => selection.focusedKey.value,
  getKeyForSearch: keyboard.getKeyForSearch,
  onSearchMatch: (key) => keyboard.focusKey(key, {scroll: true}),
});

provideListBoxContext({collection, collectionId, keyboard, listId, onAction, selection});

// Typeahead runs first on both phases: it has to claim a Space that is extending a search
// before the focused item treats the same key as an activation.
const onKeydown = (event: KeyboardEvent) => {
  typeahead.onKeydown(event);
  if (!event.defaultPrevented) keyboard.onKeydown(event);
};
</script>

<template>
  <div
    :id="listId"
    ref="element"
    :aria-multiselectable="props.selectionMode === 'multiple' ? true : undefined"
    aria-orientation="vertical"
    :class="styles"
    :data-collection="collectionId"
    :data-empty="dataAttr(collection.size.value === 0)"
    :data-focus-visible="dataAttr(selection.isFocused.value)"
    data-layout="stack"
    data-orientation="vertical"
    data-slot="list-box"
    role="listbox"
    :tabindex="keyboard.collectionTabIndex.value"
    @focusin="keyboard.onFocusin"
    @focusout="keyboard.onFocusout"
    @keydown="onKeydown"
    @keydown.capture="typeahead.onKeydownCapture"
  >
    <slot />
  </div>
</template>
