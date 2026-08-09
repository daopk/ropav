<script setup lang="ts" vapor>
import type {TableContentProps, TableSortDescriptor, TableSortDirection} from "./table.types";
import type {CollectionKey} from "../../composables/use-collection";
import type {CollectionSelection} from "../../composables/use-selection-manager";

import {computed, shallowRef, watch} from "vue";

import {useControllableState} from "../../composables/use-controllable-state";
import {useDescription} from "../../composables/use-description";
import {useGridKeyboard} from "../../composables/use-grid-keyboard";
import {useGridSelectionAnnouncement} from "../../composables/use-grid-selection-announcement";
import {useId} from "../../composables/use-id";
import {useSelectionManager} from "../../composables/use-selection-manager";
import {useTableCollection} from "../../composables/use-table-collection";
import {useTableColumnLayout} from "../../composables/use-table-column-layout";
import {useTypeahead} from "../../composables/use-typeahead";
import {composeSlotClassName} from "../../utils/compose";
import {announce} from "../../utils/live-announcer";

import {
  provideTableColumnLayoutContext,
  provideTableGridContext,
  useTableContext,
  useTableResizableContainerContext,
} from "./table.context";

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

defineSlots<{default?: () => unknown}>();

const {slots} = useTableContext();

const tableId = useId();
const collectionId = useId();

const element = shallowRef<HTMLElement | null>(null);

const collection = useTableCollection();

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

provideTableColumnLayoutContext(layout ? {...resizableContainer!, layout} : null);

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
  selection,
});

useGridSelectionAnnouncement({collection: collection.rows, selection});

const typeahead = useTypeahead({
  focusedKey: () => keyboard.focusedCell.value.rowKey,
  getKeyForSearch: keyboard.getKeyForSearch,
  onSearchMatch: (rowKey) => keyboard.focusCell({columnKey: null, rowKey}, {scroll: true}),
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

provideTableGridContext({
  collection,
  collectionId,
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

const {describedBy} = useDescription(sortDescription);

// Only after the first render: landing on the table reads the description above, so announcing
// it then would say the same thing twice.
watch(sortDescription, (description) => {
  if (description) announce(description);
});
</script>

<template>
  <table
    :id="tableId"
    ref="element"
    :aria-describedby="describedBy"
    :aria-multiselectable="selection.selectionMode.value === 'multiple' ? true : undefined"
    :class="composeSlotClassName(slots.content, props.class)"
    :data-collection="collectionId"
    data-slot="table-content"
    :role="treeColumn == null ? 'grid' : 'treegrid'"
    :style="layout ? {tableLayout: 'fixed', width: 'min-content'} : undefined"
    :tabindex="keyboard.collectionTabIndex.value"
    @focusin="keyboard.onFocusin"
    @focusout="keyboard.onFocusout"
    @keydown="onKeydown"
    @keydown.capture="typeahead.onKeydownCapture"
  >
    <slot />
  </table>
</template>
