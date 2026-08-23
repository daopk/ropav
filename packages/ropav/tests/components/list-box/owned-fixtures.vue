<script setup lang="ts" vapor>
import type { FixtureItem } from "./fixtures.types";
import type { FocusStrategy } from "@/composables/use-overlay-trigger-state";
import type { CollectionSelection } from "@/composables/use-selection-manager";

import { computed, watch } from "vue";

import { ListBoxRoot, provideListBoxStateContext } from "@/components/list-box";
import { ListBoxItemIndicator, ListBoxItemRoot } from "@/components/list-box-item";
import { useCollection } from "@/composables/use-collection";
import { useSelectionManager } from "@/composables/use-selection-manager";
import { createListCollection } from "@/utils/virtualizer-collection";

/**
 * Stands in for a picker: it owns the collection and the selection, and hands both down.
 *
 * The provider has to be a component *above* the listbox, because `inject` never sees the
 * `provide` of the component it runs in.
 */
const props = withDefaults(
  defineProps<{
    items?: FixtureItem[];
    /** Whether the collection is built from data rather than from what rendered. */
    fromData?: boolean;
    /** Whether the options are rendered at all, so a data collection can be told from a DOM one. */
    renderItems?: boolean;
    labelledBy?: string;
    listId?: string;
    autoFocus?: boolean | FocusStrategy;
    shouldFocusOnHover?: boolean;
    shouldUseVirtualFocus?: boolean;
    /** The key the owner puts virtual focus on, standing in for a control beside the listbox. */
    focusedKey?: string;
    selectionMode?: "none" | "single" | "multiple";
    defaultSelectedKeys?: Iterable<string>;
  }>(),
  {
    autoFocus: undefined,
    defaultSelectedKeys: undefined,
    focusedKey: undefined,
    fromData: undefined,
    items: (): FixtureItem[] => [
      { id: "1", name: "Bob" },
      { id: "2", name: "Fred" },
      { id: "3", name: "Martha" },
    ],
    labelledBy: undefined,
    listId: undefined,
    renderItems: true,
    selectionMode: "single",
    shouldFocusOnHover: undefined,
    shouldUseVirtualFocus: undefined,
  },
);

const emit = defineEmits<{ selectionChange: [keys: CollectionSelection] }>();

const source = computed(() =>
  props.fromData
    ? createListCollection({
        getTextValue: (item: FixtureItem) => item.name,
        items: props.items,
      })
    : null,
);

const collection = useCollection({ source: () => source.value });

const selection = useSelectionManager({
  collection,
  defaultSelectedKeys: props.defaultSelectedKeys,
  onSelectionChange: (keys) => emit("selectionChange", keys),
  selectionMode: () => props.selectionMode,
});

/*
 * The focused key moves from out here, which is how it moves under virtual focus: the arrows are
 * pressed in a control beside the listbox and the collection is told where they landed. Waits a
 * tick because the options only register post-flush, and a key the collection does not hold is
 * refused.
 */
watch(
  [() => props.focusedKey, collection.size],
  ([key]) => {
    if (key == null) return;

    selection.setFocused(true);
    selection.setFocusedKey(key);
  },
  { flush: "post", immediate: true },
);

provideListBoxStateContext({
  autoFocus: () => props.autoFocus,
  collection,
  labelledBy: () => props.labelledBy,
  listId: () => props.listId,
  selection,
  shouldFocusOnHover: () => props.shouldFocusOnHover,
  shouldUseVirtualFocus: () => props.shouldUseVirtualFocus,
});

defineExpose({ collection, selection });
</script>

<template>
  <span v-if="props.labelledBy" :id="props.labelledBy">Users</span>
  <input v-if="props.shouldUseVirtualFocus" data-testid="outside" type="text" />
  <ListBoxRoot>
    <ListBoxItemRoot
      v-for="item in props.renderItems ? props.items : []"
      :id="item.id"
      :key="item.id"
    >
      {{ item.name }}
      <ListBoxItemIndicator />
    </ListBoxItemRoot>
  </ListBoxRoot>
</template>
