<script setup lang="ts" vapor generic="T">
import type {ListBoxRootProps, ListBoxRootSlotProps} from "./list-box.types";
import type {CollectionKey} from "../../composables/use-collection";
import type {UseDroppableCollectionReturn} from "../../composables/use-droppable-collection";
import type {CollectionSelection} from "../../composables/use-selection-manager";
import type {DropTargetDelegate} from "../../utils/dnd-types";
import type {VirtualizerNode} from "../../utils/virtualizer-layout";

import {listboxVariants} from "@heroui/styles";
import {computed, shallowRef, toValue} from "vue";

import {toDragCollection} from "../../composables/drag-collection";
import {useCollection} from "../../composables/use-collection";
import {useCollectionAutoFocus} from "../../composables/use-collection-auto-focus";
import {useDndPersistedKeys} from "../../composables/use-dnd-persisted-keys";
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

import ListBoxDropIndicator from "./list-box-drop-indicator.vue";
import {provideListBoxContext, useListBoxStateContext} from "./list-box.context";

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

/**
 * The state this listbox runs on, which is not always its own.
 *
 * A picker above owns the collection and the selection, because it has to answer for them while
 * the listbox does not exist — the value in its trigger, the options in its hidden control. When
 * one is there the listbox borrows it whole rather than keeping a second copy that would drift.
 */
const owner = useListBoxStateContext();

const ownListId = useId();
const collectionId = useId();

// The owner names the listbox when it has to point at it from outside; otherwise the listbox
// names itself.
const listId = computed(() => toValue(owner?.listId) ?? ownListId.value);

const labelledBy = computed(() => toValue(owner?.labelledBy));

const shouldFocusOnHover = computed(() => Boolean(toValue(owner?.shouldFocusOnHover)));

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

const collection = owner?.collection ?? useCollection({source: () => source.value});

const selection =
  owner?.selection ??
  useSelectionManager({
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

/* -------------------------------------------------------------------------------------------------
 * Drag and drop — state
 * -----------------------------------------------------------------------------------------------*/

/**
 * Both halves are opt-in, and the hooks only exist when the caller asked for them.
 *
 * Reading them off `dragAndDropHooks` rather than importing them is what keeps the whole drag and
 * drop layer out of a listbox that does not use it.
 *
 * Split in two: the state is built here because the persisted keys are derived from it and the
 * virtualizer needs those, while the hooks that *use* the state need the keyboard delegate and so
 * have to wait until below it.
 */
const dnd = props.dragAndDropHooks;
const dragCollection = toDragCollection(collection);

const dragState = dnd?.useDraggableCollectionState?.({
  collection: dragCollection,
  getAllowedDropOperations: dnd.options.getAllowedDropOperations,
  getItems: (keys) => dnd.options.getItems?.(keys) ?? [],
  isDisabled: dnd.options.isDisabled,
  onDragEnd: (event) => dnd.options.onDragEnd?.(event),
  onDragStart: (event) => dnd.options.onDragStart?.(event),
  selectionManager: selection,
});

const dropState = dnd?.useDroppableCollectionState?.({
  ...dnd.options,
  collection: dragCollection,
  selectionManager: selection,
});

/**
 * The keys kept rendered wherever they are.
 *
 * The focused key always, exactly as React Aria does — the roving tab stop lives on that element,
 * and letting it leave the DOM drops focus to the document. During a keyboard or screen reader
 * drag the drop target joins it, because that one is reached by pressing a key rather than by
 * scrolling to it. Selected keys are deliberately *not* kept: React does not keep them either.
 */
const persistedKeys = useDndPersistedKeys(() => selection.focusedKey.value, dnd, dropState);

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
  layoutDelegate: () => keyboardLayout.value,
  onAction,
  selection,
});

/* -------------------------------------------------------------------------------------------------
 * Drag and drop — wiring
 * -----------------------------------------------------------------------------------------------*/

if (dnd && dragState) dnd.useDraggableCollection?.(dragState, element);

/**
 * The pointer half of dropping, attached statically below.
 *
 * A keyboard drag runs through the session's own document listeners, so it works without these;
 * a pointer drag reaches nothing but the element's own `dragover`, and has to be given them.
 */
let droppable: UseDroppableCollectionReturn | undefined;

if (dnd && dropState) {
  /**
   * Which delegate resolves a pointer position.
   *
   * The DOM-based one searches for elements, and outside the window there are none — so a
   * virtualized list asks its layout instead, which knows where every item *would* be. The
   * layout only answers when it implements the method, so one without drag and drop support
   * falls back.
   */
  const dropLayout = virtualizerConfig?.layout.value;
  const pointerDelegate: DropTargetDelegate =
    dropLayout?.getDropTargetFromPoint != null
      ? (dropLayout as DropTargetDelegate)
      : new dnd.ListDropTargetDelegate!(dragCollection, element, {
          layout: "stack",
          orientation: "vertical",
        });

  droppable = dnd.useDroppableCollection?.(
    {
      ...dnd.options,
      dropTargetDelegate: dnd.dropTargetDelegate ?? pointerDelegate,
      keyboardDelegate: keyboard,
    },
    dropState,
    element,
  );
}

/** Whether the collection as a whole is the current drop target. */
const isRootDropTarget = computed(() => dropState?.isDropTarget({type: "root"}) ?? false);

/**
 * A windowed listbox renders its own drop indicators; a plain one leaves them to the caller.
 *
 * Not a second way of doing the same thing — it is the only way. An indicator is positioned
 * against the item wrappers it sits between, which makes it their **sibling**, and this is the
 * level that produces them. Markup written in the item slot lands *inside* one wrapper, where an
 * absolute offset would be measured from the wrong origin and clipped by its overflow.
 */
const rendersDropIndicators = computed(() => isVirtualized.value && dropState != null);

/** The gap after the last item, which no item's own "before" indicator covers. */
const lastItemKey = computed(() => collection.getLastKey());

const typeahead = useTypeahead({
  focusedKey: () => selection.focusedKey.value,
  getKeyForSearch: keyboard.getKeyForSearch,
  onSearchMatch: (key) => keyboard.focusKey(key, {scroll: true}),
});

provideListBoxContext({
  collection,
  collectionId,
  dragAndDropHooks: dnd,
  dragState,
  dropState,
  keyboard,
  listId,
  onAction,
  selection,
  shouldFocusOnHover,
});

/**
 * A listbox owned from above appears already open, so it has to place focus itself.
 *
 * One standing on its own is part of the page and never does: taking focus on mount would steal
 * it from wherever the user actually is.
 */
if (owner) {
  useCollectionAutoFocus({autoFocus: owner.autoFocus, element, keyboard, selection});
}

if (virtualizer && virtualizerConfig) {
  provideVirtualizerStateContext({
    getIndex: (key) => collection.getIndex(key),
    getDropTargetLayoutInfo: virtualizerConfig.layout.value.getDropTargetLayoutInfo?.bind(
      virtualizerConfig.layout.value,
    ),
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
    :aria-labelledby="labelledBy"
    :aria-multiselectable="selection.selectionMode.value === 'multiple' ? true : undefined"
    aria-orientation="vertical"
    :class="styles"
    :data-collection="collectionId"
    :data-drop-target="dataAttr(isRootDropTarget)"
    :data-empty="dataAttr(collection.size.value === 0)"
    :data-focus-visible="dataAttr(selection.isFocused.value)"
    data-layout="stack"
    data-orientation="vertical"
    data-slot="list-box"
    role="listbox"
    :tabindex="keyboard.collectionTabIndex.value"
    @dragenter="droppable?.handlers.onDragenter($event)"
    @dragleave="droppable?.handlers.onDragleave($event)"
    @dragover="droppable?.handlers.onDragover($event)"
    @drop="droppable?.handlers.onDrop($event)"
    @focusin="keyboard.onFocusin"
    @focusout="keyboard.onFocusout"
    @keydown="onKeydown"
    @keydown.capture="typeahead.onKeydownCapture"
  >
    <div v-if="isVirtualized" role="presentation" :style="scroll?.contentStyle.value">
      <template v-for="view in virtualizer?.visibleViews.value" :key="view.key">
        <ListBoxDropIndicator
          v-if="rendersDropIndicators"
          :target="{dropPosition: 'before', key: view.key, type: 'item'}"
        />
        <VirtualizerItem :layout-info="view.layoutInfo">
          <slot :index="view.node?.index" :item="itemOf(view.node)" />
        </VirtualizerItem>
      </template>
      <ListBoxDropIndicator
        v-if="rendersDropIndicators && lastItemKey != null"
        :target="{dropPosition: 'after', key: lastItemKey, type: 'item'}"
      />
    </div>
    <slot v-else />
  </div>
</template>
