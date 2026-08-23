<script setup lang="ts" vapor>
import type {CollectionSelection} from "../../composables/use-selection-manager";
import type {TagGroupRootProps} from "./tag-group.types";

import {tagGroupVariants} from "@ropav/styles";
import {computed, shallowRef} from "vue";

import {useCollection} from "../../composables/use-collection";
import {provideFieldIdsContext, useFieldIds} from "../../composables/use-field-ids";
import {useId} from "../../composables/use-id";
import {useListKeyboard} from "../../composables/use-list-keyboard";
import {useSelectionManager} from "../../composables/use-selection-manager";
import {useTypeahead} from "../../composables/use-typeahead";

import {provideTagGroupContext} from "./tag-group.context";

const props = defineProps<TagGroupRootProps>();

const emit = defineEmits<{
  selectionChange: [keys: CollectionSelection];
  "update:selectedKeys": [keys: CollectionSelection];
}>();

defineSlots<{default?: () => unknown}>();

const slots = computed(() => tagGroupVariants());

const listId = useId();
const collectionId = useId();
const listElement = shallowRef<HTMLElement | null>(null);

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

// A tag group lays its tags out inline and wraps them, so all four arrows navigate and the ends
// loop round — unlike a listbox, which is a single column that stops at its edges.
const keyboard = useListKeyboard({
  collection,
  element: listElement,
  orientation: "horizontal",
  selection,
  shouldFocusWrap: true,
});

const typeahead = useTypeahead({
  focusedKey: () => selection.focusedKey.value,
  getKeyForSearch: keyboard.getKeyForSearch,
  onSearchMatch: (key) => keyboard.focusKey(key, {scroll: true}),
});

// The group's label names a composite rather than a form control, so it renders as a span.
const fieldIds = useFieldIds({labelElementType: "span"});

// Removal is offered exactly when the caller supplies a handler for it, which is what React
// infers too. A declared emit could not answer this: Vue strips declared listeners from
// `$attrs`, so there is no way to ask whether one is bound.
const allowsRemoving = computed(() => props.onRemove !== undefined);

provideFieldIdsContext(fieldIds.context);
provideTagGroupContext({
  allowsRemoving,
  collection,
  collectionId,
  keyboard,
  listId,
  fieldIds,
  listElement,
  removeKeys: (keys) => props.onRemove?.(new Set(keys)),
  selection,
  size: computed(() => props.size),
  slots,
  typeahead,
  variant: computed(() => props.variant),
});
</script>

<template>
  <div :class="slots.base({class: props.class})" data-slot="tag-group">
    <slot />
  </div>
</template>
