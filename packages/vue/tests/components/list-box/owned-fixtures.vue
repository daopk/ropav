<script setup lang="ts" vapor>
import type {FixtureItem} from "./fixtures.types";
import type {FocusStrategy} from "@/composables/use-overlay-trigger-state";
import type {CollectionSelection} from "@/composables/use-selection-manager";

import {computed} from "vue";

import {ListBoxRoot, provideListBoxStateContext} from "@/components/list-box";
import {ListBoxItemIndicator, ListBoxItemRoot} from "@/components/list-box-item";
import {useCollection} from "@/composables/use-collection";
import {useSelectionManager} from "@/composables/use-selection-manager";
import {createListCollection} from "@/utils/virtualizer-collection";

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
    selectionMode?: "none" | "single" | "multiple";
    defaultSelectedKeys?: Iterable<string>;
  }>(),
  {
    autoFocus: undefined,
    defaultSelectedKeys: undefined,
    fromData: undefined,
    items: (): FixtureItem[] => [
      {id: "1", name: "Bob"},
      {id: "2", name: "Fred"},
      {id: "3", name: "Martha"},
    ],
    labelledBy: undefined,
    listId: undefined,
    renderItems: true,
    selectionMode: "single",
    shouldFocusOnHover: undefined,
  },
);

const emit = defineEmits<{selectionChange: [keys: CollectionSelection]}>();

const source = computed(() =>
  props.fromData
    ? createListCollection({
        getTextValue: (item: FixtureItem) => item.name,
        items: props.items,
      })
    : null,
);

const collection = useCollection({source: () => source.value});

const selection = useSelectionManager({
  collection,
  defaultSelectedKeys: props.defaultSelectedKeys,
  onSelectionChange: (keys) => emit("selectionChange", keys),
  selectionMode: () => props.selectionMode,
});

provideListBoxStateContext({
  autoFocus: () => props.autoFocus,
  collection,
  labelledBy: () => props.labelledBy,
  listId: () => props.listId,
  selection,
  shouldFocusOnHover: () => props.shouldFocusOnHover,
});

defineExpose({collection, selection});
</script>

<template>
  <span v-if="props.labelledBy" :id="props.labelledBy">Users</span>
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
