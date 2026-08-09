<script setup lang="ts" vapor generic="T">
import type {ListBoxRootProps, ListBoxRootSlotProps} from "./list-box.types";
import type {CollectionKey} from "../../composables/use-collection";
import type {CollectionSelection} from "../../composables/use-selection-manager";
import type {VirtualizerNode} from "../../utils/virtualizer-layout";

import {listboxVariants} from "@heroui/styles";
import {computed, shallowRef} from "vue";

import {useCollection} from "../../composables/use-collection";
import {useId} from "../../composables/use-id";
import {useListKeyboard} from "../../composables/use-list-keyboard";
import {useSelectionManager} from "../../composables/use-selection-manager";
import {useTypeahead} from "../../composables/use-typeahead";
import {useVirtualizer} from "../../composables/use-virtualizer";
import {useVirtualizerScroll} from "../../composables/use-virtualizer-scroll";
import {dataAttr} from "../../utils/assertion";
import {createListCollection} from "../../utils/virtualizer-collection";
import {VirtualizerItem} from "../virtualizer";
import {
  provideVirtualizerStateContext,
  useVirtualizerConfigContext,
} from "../virtualizer/virtualizer.context";

import {provideListBoxContext} from "./list-box.context";

/** Stands in while a virtualized listbox has no data yet, so the layout has something to read. */
const EMPTY_COLLECTION = createListCollection({items: []});

const props = defineProps<ListBoxRootProps<T>>();

const emit = defineEmits<{
  action: [key: CollectionKey];
  selectionChange: [keys: CollectionSelection];
  "update:selectedKeys": [keys: CollectionSelection];
}>();

defineSlots<{default?: (props: ListBoxRootSlotProps<T>) => unknown}>();

/**
 * A node's datum, back as the item type it came in as.
 *
 * `VirtualizerNode.content` is `unknown` on purpose — the virtualizer carries data it never looks
 * at, and the same layout serves a table. This listbox is the one place that knows better: it
 * built the collection out of its own `items`, so naming `T` here restates what went in.
 */
const itemOf = (node?: VirtualizerNode) => node?.content as T | undefined;

const styles = computed(() => listboxVariants({class: props.class, variant: props.variant}));

const listId = useId();
const collectionId = useId();
const element = shallowRef<HTMLElement | null>(null);

const virtualizerConfig = useVirtualizerConfigContext();

/**
 * The collection built from data rather than from what rendered.
 *
 * Only when both halves are there: data on this listbox, and a `Virtualizer` above it. Data
 * without a virtualizer would mean rendering every item anyway, which is what the plain slot
 * already does.
 */
const source = computed(() => {
  if (!virtualizerConfig || !props.items) return null;

  return createListCollection({
    getKey: props.itemKey,
    getTextValue: props.itemTextValue,
    items: props.items,
  });
});

const isVirtualized = computed(() => source.value != null);

const collection = useCollection({source: () => source.value});

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

/**
 * The focused key is kept rendered wherever it is, exactly as React Aria does — the roving tab
 * stop lives on that element, and letting it leave the DOM drops focus to the document. Selected
 * keys are deliberately *not* kept: React does not keep them either.
 */
const persistedKeys = computed(() => {
  const key = selection.focusedKey.value;

  return key == null ? new Set<CollectionKey>() : new Set([key]);
});

const virtualizer = virtualizerConfig
  ? useVirtualizer({
      collection: () => source.value ?? EMPTY_COLLECTION,
      layout: () => virtualizerConfig.layout.value,
      layoutOptions: () => virtualizerConfig.layoutOptions.value,
      persistedKeys: () => persistedKeys.value,
    })
  : null;

const scroll =
  virtualizer &&
  useVirtualizerScroll({
    contentSize: () => virtualizer.contentSize.value,
    element,
    isScrolling: () => virtualizer.isScrolling.value,
    onScrollEnd: virtualizer.endScrolling,
    onScrollStart: virtualizer.startScrolling,
    onSizeChange: virtualizer.setSize,
    onVisibleRectChange: virtualizer.setVisibleRect,
  });

/**
 * Paging asks the layout where the rows are, not the DOM.
 *
 * `PageDown` in a virtualized listbox has to move by a viewport of *collection*, and most of
 * that viewport is not rendered. Without a virtualizer above, there is no delegate and paging
 * measures elements as before.
 */
const keyboardLayout = computed(() =>
  virtualizer
    ? {
        getContentSize: () => virtualizer.contentSize.value,
        getItemRect: (key: CollectionKey) => virtualizer.getLayoutInfo(key)?.rect ?? null,
        getVisibleRect: () => virtualizer.visibleRect.value,
      }
    : null,
);

const keyboard = useListKeyboard({
  collection,
  element,
  layout: () => keyboardLayout.value,
  onAction,
  selection,
});

const typeahead = useTypeahead({
  focusedKey: () => selection.focusedKey.value,
  getKeyForSearch: keyboard.getKeyForSearch,
  onSearchMatch: (key) => keyboard.focusKey(key, {scroll: true}),
});

provideListBoxContext({collection, collectionId, keyboard, listId, onAction, selection});

if (virtualizer && virtualizerConfig) {
  provideVirtualizerStateContext({
    getIndex: (key) => collection.getIndex(key),
    getLayoutInfo: virtualizer.getLayoutInfo,
    itemCount: computed(() => source.value?.itemCount ?? 0),
    shouldObserveItemSize: virtualizerConfig.shouldObserveItemSize,
    updateItemSize: virtualizer.updateItemSize,
  });
}

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
    <div v-if="isVirtualized" role="presentation" :style="scroll?.contentStyle.value">
      <VirtualizerItem
        v-for="view in virtualizer?.visibleViews.value"
        :key="view.key"
        :layout-info="view.layoutInfo"
      >
        <slot :index="view.node?.index" :item="itemOf(view.node)" />
      </VirtualizerItem>
    </div>
    <slot v-else />
  </div>
</template>
