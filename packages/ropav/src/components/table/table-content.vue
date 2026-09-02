<script setup lang="ts" vapor>
import type { CollectionKey } from "../../composables/use-collection";
import type { UseDroppableCollectionReturn } from "../../composables/use-droppable-collection";
import type { CollectionSelection } from "../../composables/use-selection-manager";
import type { DropTargetDelegate } from "../../utils/dnd-types";
import type { TableContentProps, TableSortDescriptor, TableSortDirection } from "./table.types";
import type { TableCollectionItems } from "./use-table-collection";

import { computed, shallowRef, watch } from "vue";

import { useControllableState } from "../../composables/use-controllable-state";
import { useDescription } from "../../composables/use-description";
import { useDndPersistedKeys } from "../../composables/use-dnd-persisted-keys";
import { useId } from "../../composables/use-id";
import { useLocale } from "../../composables/use-locale";
import { useSelectionManager } from "../../composables/use-selection-manager";
import { useTypeahead } from "../../composables/use-typeahead";
import { useVirtualizer } from "../../composables/use-virtualizer";
import { useVirtualizerScroll } from "../../composables/use-virtualizer-scroll";
import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";
import { TreeDropTargetDelegate } from "../../utils/dnd-tree-drop-target-delegate";
import { announce } from "../../utils/live-announcer";
import { Size } from "../../utils/virtualizer-geometry";
import {
  provideVirtualizerStateContext,
  useVirtualizerConfigContext,
} from "../virtualizer/virtualizer.context";

import { toTableDragCollection } from "./table-drag-collection";
import {
  provideTableColumnLayoutContext,
  provideTableGridContext,
  provideTableVirtualizerContext,
  useTableContext,
  useTableResizableContainerContext,
} from "./table.context";
import { useGridKeyboard } from "./use-grid-keyboard";
import { useGridSelectionAnnouncement } from "./use-grid-selection-announcement";
import { useTableCollection } from "./use-table-collection";
import { buildColumnWidths, useTableColumnLayout } from "./use-table-column-layout";

// `disallowEmptySelection` carries three states: a Boolean prop with no default is cast to
// `false`, which reads as a caller decision the selection manager would then honour.
const props = withDefaults(defineProps<TableContentProps>(), {
  disallowEmptySelection: undefined,
});

const emit = defineEmits<{
  expandedChange: [keys: Set<CollectionKey>];
  selectionChange: [keys: CollectionSelection];
  "update:expandedKeys": [keys: Set<CollectionKey>];
  sortChange: [descriptor: TableSortDescriptor];
  "update:selectedKeys": [keys: CollectionSelection];
  "update:sortDescriptor": [descriptor: TableSortDescriptor];
}>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useTableContext();

const tableId = useId();
const collectionId = useId();

const element = shallowRef<HTMLElement | null>(null);

/**
 * Whether the rows are windowed, which is decided by the presence of a `Virtualizer` above and
 * nothing else — the same thing that decides it in React Aria.
 *
 * It has to be known here, before the children run: it is what the table's elements *are*. A
 * `Virtualizer` whose body was given no rows renders a header and no rows, which is the honest
 * answer to asking for a window over nothing.
 */
const virtualizerConfig = useVirtualizerConfigContext();
const isVirtualized = virtualizerConfig != null;

/** The rows' data, registered by the body. Empty until the body's own setup has run. */
const bodyItems = shallowRef<TableCollectionItems | null>(null);
const hasLoader = shallowRef(false);
/** The scroll box's own size, which is what the columns are divided up over. */
const containerSize = shallowRef(new Size());

const collection = useTableCollection({
  hasLoader: isVirtualized ? () => hasLoader.value : undefined,
  idPrefix: () => collectionId.value,
  items: isVirtualized ? () => bodyItems.value : undefined,
});

/**
 * Selection runs on the **row** collection rather than on a collection of rows and cells, which
 * is how React Aria has it. Nothing about a selection is two-dimensional, and keeping the manager
 * one-dimensional is what lets the listbox's manager be reused here unchanged.
 */
const selection = useSelectionManager({
  collection: collection.rows,
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

/**
 * Column widths only exist inside a resizable container, which is what supplies the width they
 * are laid out against. The layout is built here rather than there because it needs the
 * collection, and only the grid has one — the same split React Aria makes.
 */
const resizableContainer = useTableResizableContainerContext();

const columnDefinitions = () =>
  collection.columns.orderedKeys.value.map((key) => {
    const column = collection.columns.getItem(key);

    return {
      defaultWidth: column?.defaultWidth(),
      key,
      maxWidth: column?.maxWidth(),
      minWidth: column?.minWidth(),
      width: column?.width(),
    };
  });

const layout = resizableContainer
  ? useTableColumnLayout({
      columns: columnDefinitions,
      tableWidth: resizableContainer.tableWidth,
    })
  : null;

provideTableColumnLayoutContext(layout ? { ...resizableContainer!, layout } : null);

/**
 * How wide each column is, for the layout to place cells at.
 *
 * The same numbers the browser lays a plain table out with: inside a resizable container they come
 * from the resize state, exactly as React Aria's `TableLayout.useLayoutOptions` reads them, and
 * otherwise they are divided out over the scroll box here.
 */
const columnWidths = computed(() =>
  layout
    ? layout.columnWidths.value
    : buildColumnWidths(containerSize.value.width, columnDefinitions()),
);

const treeColumn = computed(() => props.treeColumn ?? null);

/**
 * Which rows are open. Held as its own controllable state rather than through the selection
 * manager: expansion is not a selection — it does not follow the selection mode, it is not
 * announced, and a row can be open and unselected at once.
 */
const expanded = useControllableState<Set<CollectionKey>>({
  defaultValue: new Set(props.defaultExpandedKeys ?? []),
  onValueChange: (keys) => {
    emit("expandedChange", keys);
    emit("update:expandedKeys", keys);
  },
  value: () => (props.expandedKeys === undefined ? undefined : new Set(props.expandedKeys)),
});

const expandedKeys = computed<Set<CollectionKey>>(() =>
  treeColumn.value == null ? new Set() : expanded.state.value,
);

const toggleExpanded = (rowKey: CollectionKey) => {
  if (treeColumn.value == null) return;

  const next = new Set(expanded.state.value);

  if (next.has(rowKey)) next.delete(rowKey);
  else next.add(rowKey);

  expanded.setState(next);
};

/* -------------------------------------------------------------------------------------------------
 * Drag and drop — state
 * -----------------------------------------------------------------------------------------------*/

/**
 * Both halves are opt-in, and the hooks only exist when the caller asked for them.
 *
 * Reading them off `dragAndDropHooks` rather than importing them is what keeps the whole drag
 * and drop layer out of a table that does not use it.
 *
 * Split in two: the state is built here because the persisted keys are derived from it and the
 * virtualizer needs those, while the hooks that *use* the state need the keyboard delegate and so
 * have to wait until below it.
 */
const dnd = props.dragAndDropHooks;
const dragCollection = toTableDragCollection(collection);
// Named apart from `sort`'s own `direction` parameter, which is a sort order rather than a
// writing direction.
const locale = useLocale();
const textDirection = computed(() => locale.value.direction);

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
 * The rows kept rendered wherever they are.
 *
 * The focused row always, exactly as React Aria does — the roving tab stop lives on that element,
 * and letting it leave the DOM drops focus to the document; its cells come with it, because every
 * cell of a placed row is placed. During a keyboard or screen reader drag the drop target joins
 * it, because that one is reached by pressing a key rather than by scrolling to it. Selected rows
 * are deliberately *not* kept: React does not keep them either.
 */
const persistedKeys = useDndPersistedKeys(() => selection.focusedKey.value, dnd, dropState);

const virtualizer =
  isVirtualized && collection.virtualized
    ? useVirtualizer({
        collection: () => collection.virtualized!.value,
        layout: () => virtualizerConfig!.layout.value,
        // Merged rather than replaced: the caller's `Virtualizer` carries the row heights, and the
        // table carries the widths, which is the split React Aria makes with `useLayoutOptions`.
        layoutOptions: () => ({
          ...virtualizerConfig!.layoutOptions.value,
          columnWidths: columnWidths.value,
        }),
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
    onSizeChange: (size) => {
      containerSize.value = size;
      virtualizer.setSize(size);
    },
    onVisibleRectChange: virtualizer.setVisibleRect,
  });

/**
 * The rows inside the window. The body renders these rather than every row it was given.
 *
 * Rows only: the body's other child is the loading sentinel, which the layout keeps rendered
 * wherever the window is and which `Table.LoadMore` renders itself, from its own slot.
 */
const rowViews = computed(() => {
  if (!virtualizer || !collection.virtualized) return [];

  const bodyKey = collection.virtualized.value.bodyKey;
  const body = virtualizer.visibleViews.value.find((view) => view.key === bodyKey);

  return (body?.children ?? []).filter((view) => view.node?.type === "row");
});

/**
 * Paging asks the layout where the rows are, not the DOM.
 *
 * `PageDown` in a virtualized table has to move by a viewport of *collection*, and most of that
 * viewport is not rendered. Without a virtualizer there is no delegate and paging measures
 * elements as before.
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

const keyboard = useGridKeyboard({
  collection,
  element,
  // Expansion rides on the horizontal arrows, so the grid has to ask before it navigates.
  expansion: {
    hasChildRows: (rowKey) => Boolean(collection.tree.getItem(rowKey)?.hasChildRows()),
    isExpanded: (rowKey) => expandedKeys.value.has(rowKey),
    isTree: () => treeColumn.value != null,
    parentKey: (rowKey) => collection.tree.getItem(rowKey)?.parentKey() ?? null,
    toggle: toggleExpanded,
  },
  // Arrow keys belong to the resizer while a column is being dragged, exactly as React Aria
  // disables the grid's own navigation for the duration.
  isDisabled: () => layout?.resizingColumn.value != null,
  layout: () => keyboardLayout.value,
  selection,
});

useGridSelectionAnnouncement({ collection: collection.rows, selection });

/* -------------------------------------------------------------------------------------------------
 * Drag and drop — wiring
 * -----------------------------------------------------------------------------------------------*/

if (dnd && dragState) dnd.useDraggableCollection?.(dragState, element);

/**
 * Rows in document order, which is the walk a drag makes down the table.
 *
 * Built here rather than reusing `keyboard`: the grid's own navigation moves through cells and
 * column headers as well as rows, and a drag only ever lands on a row. React Aria makes the same
 * split, constructing a fresh `ListKeyboardDelegate` for the drop side.
 */
const dropKeyboardDelegate = {
  // Landing focus goes through the grid's own `focusCell`, which knows to wait a render for a
  // windowed row that is not in the DOM yet.
  focusKey: (key: CollectionKey) =>
    keyboard.focusCell({ columnKey: null, rowKey: key }, { scroll: true }),
  getFirstKey: () => collection.rows.getFirstKey(),
  getKeyAbove: (key: CollectionKey) => collection.rows.getKeyBefore(key),
  getKeyBelow: (key: CollectionKey) => collection.rows.getKeyAfter(key),
  getLastKey: () => collection.rows.getLastKey(),
};

/**
 * The pointer half of dropping, attached statically below.
 *
 * A keyboard drag runs through the session's own document listeners, so it works without these;
 * a pointer drag reaches nothing but the element's own `dragover`, and has to be given them.
 */
let droppable: UseDroppableCollectionReturn | undefined;

if (dnd && dropState) {
  /**
   * The tree delegate wraps the flat one rather than replacing it.
   *
   * Finding which row the pointer is over is the same problem either way; what differs is what
   * the gap under the last child of a subtree *means*, which is the ambiguity the wrapper
   * resolves. A flat table has no such gaps, so it costs nothing there.
   */
  const pointerDelegate =
    dnd.dropTargetDelegate ??
    // The DOM-based delegate searches for elements, and outside the window there are none — so
    // a virtualized table asks its layout instead, which knows where every row *would* be.
    (virtualizerConfig?.layout.value.getDropTargetFromPoint != null
      ? (virtualizerConfig.layout.value as DropTargetDelegate)
      : new dnd.ListDropTargetDelegate!(dragCollection, element, {
          direction: textDirection.value,
          layout: "stack",
          orientation: "vertical",
        }));

  droppable = dnd.useDroppableCollection?.(
    {
      ...dnd.options,
      dropTargetDelegate: new TreeDropTargetDelegate(pointerDelegate, {
        collection: () => dragCollection,
        direction: () => textDirection.value,
        expandedKeys: () => expandedKeys.value,
      }),
      keyboardDelegate: dropKeyboardDelegate,
      /**
       * A drag resting on a closed row opens it, so its children become reachable.
       *
       * Only opens for a pointer: with a keyboard or a screen reader the same gesture toggles,
       * because there is no "rest here" to distinguish from "step past".
       */
      onDropActivate(event) {
        dnd.options.onDropActivate?.(event);

        if (event.target.type !== "item") return;

        const key = event.target.key;
        const hasChildRows = Boolean(collection.tree.getItem(key)?.hasChildRows());

        if (!hasChildRows) return;
        if (expandedKeys.value.has(key) && !dnd.isVirtualDragging?.()) return;

        toggleExpanded(key);
      },
      // Left and right open and close the row being dropped *on*, which is the only way to
      // reach a collapsed row's children during a keyboard drag.
      onKeyDown(event) {
        const target = dropState.target.value;

        if (target?.type !== "item" || target.dropPosition !== "on") return;
        if (!collection.tree.getItem(target.key)?.hasChildRows()) return;

        const isExpanded = expandedKeys.value.has(target.key);
        const expandKey = textDirection.value === "rtl" ? "ArrowLeft" : "ArrowRight";
        const collapseKey = textDirection.value === "rtl" ? "ArrowRight" : "ArrowLeft";

        if (event.key === expandKey && !isExpanded) toggleExpanded(target.key);
        else if (event.key === collapseKey && isExpanded) toggleExpanded(target.key);
      },
    },
    dropState,
    element,
  );
}

/** Whether the table as a whole is the current drop target. */
const isRootDropTarget = computed(() => dropState?.isDropTarget({ type: "root" }) ?? false);

const typeahead = useTypeahead({
  focusedKey: () => keyboard.focusedCell.value.rowKey,
  getKeyForSearch: keyboard.getKeyForSearch,
  onSearchMatch: (rowKey) => keyboard.focusCell({ columnKey: null, rowKey }, { scroll: true }),
});

// Typeahead runs first on both phases: it has to claim a Space that is extending a search before
// the focused row treats the same key as a selection.
const onKeydown = (event: KeyboardEvent) => {
  typeahead.onKeydown(event);
  if (!event.defaultPrevented) keyboard.onKeydown(event);
};

const sortDescriptor = computed(() => props.sortDescriptor ?? null);

const OPPOSITE_DIRECTION: Record<TableSortDirection, TableSortDirection> = {
  ascending: "descending",
  descending: "ascending",
};

/**
 * Ported from react-stately's `useTableState`: sorting is entirely the caller's, so this only
 * reports what was asked for. Pressing the column that is already sorted flips it; pressing any
 * other column starts ascending.
 */
const sort = (columnKey: CollectionKey, direction?: TableSortDirection) => {
  const current = sortDescriptor.value;
  const next: TableSortDescriptor = {
    column: columnKey,
    direction:
      direction ??
      (current?.column === columnKey ? OPPOSITE_DIRECTION[current.direction] : "ascending"),
  };

  emit("sortChange", next);
  emit("update:sortDescriptor", next);
};

if (virtualizer && collection.virtualized && scroll) {
  provideTableVirtualizerContext({
    collection: collection.virtualized,
    contentStyle: scroll.contentStyle,
    getLayoutInfo: virtualizer.getLayoutInfo,
    rowViews,
    setHasLoader: (value) => {
      hasLoader.value = value;
    },
    setItems: (items) => {
      bodyItems.value = items;
    },
  });

  provideVirtualizerStateContext({
    getDropTargetLayoutInfo: virtualizerConfig!.layout.value.getDropTargetLayoutInfo?.bind(
      virtualizerConfig!.layout.value,
    ),
    getIndex: (key) => collection.rows.getIndex(key),
    getLayoutInfo: virtualizer.getLayoutInfo,
    itemCount: computed(() => collection.rows.size.value),
    shouldObserveItemSize: virtualizerConfig!.shouldObserveItemSize,
    updateItemSize: virtualizer.updateItemSize,
  });
}

provideTableGridContext({
  collection,
  collectionId,
  columnCount: computed(() => collection.columns.size.value),
  dragAndDropHooks: dnd,
  dragState,
  dropState,
  expandedKeys,
  keyboard,
  selection,
  sort,
  sortDescriptor,
  tableId,
  toggleExpanded,
  treeColumn,
});

/**
 * What the table itself is described by while it is sorted. `aria-sort` on the column already
 * says it, but only when focus is on that column — this is what tells someone landing on the
 * table how it is ordered.
 */
const sortDescription = computed(() => {
  const descriptor = sortDescriptor.value;

  if (!descriptor) return undefined;

  const columnName = collection.columns.getItem(descriptor.column)?.textValue() ?? "";

  return `sorted by column ${columnName} in ${descriptor.direction} order`;
});

const { describedBy } = useDescription(sortDescription);

// Only after the first render: landing on the table reads the description above, so announcing
// it then would say the same thing twice.
watch(sortDescription, (description) => {
  if (description) announce(description);
});

/**
 * A CSS table lays its own columns out, and the two declarations below are how a resizable one is
 * held to the widths it was given. Virtualized there is no CSS table to hold: the elements are
 * divs, every cell is placed absolutely, and `min-content` on a div would collapse it.
 */
const tableStyle = computed(() =>
  layout && !isVirtualized ? { tableLayout: "fixed", width: "min-content" } : undefined,
);
</script>

<template>
  <component
    :is="isVirtualized ? 'div' : 'table'"
    :id="tableId"
    ref="element"
    :aria-colcount="isVirtualized ? collection.columns.size.value : undefined"
    :aria-describedby="describedBy"
    :aria-multiselectable="selection.selectionMode.value === 'multiple' ? true : undefined"
    :aria-rowcount="isVirtualized ? collection.rows.size.value + 1 : undefined"
    :class="composeSlotClassName(slots.content, props.class)"
    :data-allows-dragging="dataAttr(dragState != null)"
    :data-collection="collectionId"
    :data-drop-target="dataAttr(isRootDropTarget)"
    data-slot="table-content"
    :role="treeColumn == null ? 'grid' : 'treegrid'"
    :style="tableStyle"
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
      <slot />
    </div>
    <slot v-else />
  </component>
</template>
