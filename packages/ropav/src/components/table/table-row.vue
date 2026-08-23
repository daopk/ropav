<script setup lang="ts" vapor>
import type { TableCellMeta } from "../../composables/use-table-collection";
import type { TableRowProps, TableRowSlotProps } from "./table.types";

import { computed, shallowRef, watch } from "vue";

import { useId } from "../../composables/use-id";
import { useInteractionStates } from "../../composables/use-interaction-states";
import {
  createTableRegistry,
  isTableCellControl,
  tableCellId,
} from "../../composables/use-table-collection";
import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";
import { visuallyHiddenStyle } from "../../utils/visually-hidden";

import {
  provideTableRowContext,
  useTableContext,
  useTableGridContext,
  useTableVirtualizerContext,
} from "./table.context";

const props = defineProps<TableRowProps>();

defineSlots<{ default?: (props: TableRowSlotProps) => unknown }>();

const { slots } = useTableContext();
const {
  collection,
  collectionId,
  columnCount,
  dragAndDropHooks,
  dragState,
  dropState,
  expandedKeys,
  keyboard,
  selection,
  tableId,
  toggleExpanded,
  treeColumn,
} = useTableGridContext();

// Falls back to a generated key so a row without an `id` still has a stable identity.
const generatedKey = useId();
const rowKey = computed(() => props.id ?? generatedKey.value);

const cells = createTableRegistry<TableCellMeta>();

// One-based on the wire, zero-based in the API — `aria-level` counts the body row as level one,
// which is what React Aria renders even for a flat table.
const level = computed(() => (props.level ?? 0) + 1);
const hasChildRows = computed(() => Boolean(props.hasChildRows));
const isExpanded = computed(() => expandedKeys.value.has(rowKey.value));
const isTree = computed(() => treeColumn.value != null);

const element = shallowRef<HTMLElement | null>(null);

/**
 * The text this row is matched on, ported from react-stately's `TableCollection.getTextValue`:
 * an authored `textValue` wins, otherwise the row is named by the text of its row header cells.
 */
const textValue = () => {
  if (props.textValue != null) return props.textValue;

  const rowHeaders = collection.rowHeaderColumnKeys.value;

  return cells.orderedKeys.value
    .filter((_, index) => {
      const columnKey = collection.columns.keyAt(index);

      return columnKey != null && rowHeaders.has(columnKey);
    })
    .map((key) => cells.getItem(key)?.textValue() ?? "")
    .filter(Boolean)
    .join(" ");
};

watch(
  element,
  (current, _previous, onCleanup) => {
    if (!current) return;

    onCleanup(
      collection.rows.register(rowKey.value, {
        element: () => element.value,
        isDisabled: () => false,
        textValue,
      }),
    );

    // Nesting is registered beside the collection rather than in it, so the row collection stays
    // the plain shape the selection manager and the typeahead take.
    onCleanup(
      collection.tree.register(rowKey.value, {
        element: () => element.value,
        hasChildRows: () => hasChildRows.value,
        level: () => props.level ?? 0,
        parentKey: () => props.parentKey ?? null,
      }),
    );
  },
  { flush: "post", immediate: true },
);

// A row is named by its row header cells, whose ids are derived rather than read back, so the
// reference is known before those cells have registered.
const ariaLabelledBy = computed(() =>
  [...collection.rowHeaderColumnKeys.value]
    .map((columnKey) => tableCellId(tableId.value, rowKey.value, columnKey))
    .join(" "),
);

const selectionMode = computed(() => selection.selectionMode.value);
const isSelected = computed(() => selection.isSelected(rowKey.value));
const isDisabled = computed(() => selection.isDisabled(rowKey.value));

const position = computed(() => collection.tree.position(rowKey.value));

/* -------------------------------------------------------------------------------------------------
 * Drag and drop
 * -----------------------------------------------------------------------------------------------*/

/**
 * A row drags from a handle rather than from itself.
 *
 * `hasDragButton` moves the keyboard and screen-reader path onto that handle, which is what a
 * table needs and a listbox option does not: a row is a two-dimensional thing the arrows already
 * walk into, so Enter on the row cannot also mean "drag me". The handle is only ever reached by
 * keyboard or assistive technology — a mouse press falls through it to the row, which carries
 * the native drag.
 */
const draggable =
  dragState && dragAndDropHooks?.useDraggableItem
    ? dragAndDropHooks.useDraggableItem({ hasDragButton: true, key: rowKey.value }, dragState)
    : null;

/**
 * Dropping **on** the row, as an element a screen reader can reach.
 *
 * Its own hidden button rather than the row itself: the row is already an option in the grid's
 * navigation, and giving it a second identity as a drop target would make it announce twice.
 * The gaps between rows are `Table.DropIndicator`, placed by the caller.
 */
const dropIndicatorElement = shallowRef<HTMLElement | null>(null);

const dropIndicator =
  dropState && dragAndDropHooks?.useDropIndicator
    ? dragAndDropHooks.useDropIndicator(
        { target: { dropPosition: "on", key: rowKey.value, type: "item" } },
        dropState,
        dropIndicatorElement,
      )
    : null;

const isDragging = computed(() => dragState?.isDragging(rowKey.value) ?? false);
const isDropTarget = computed(() => dropIndicator?.isDropTarget.value ?? false);
const allowsDragging = computed(() => draggable != null);

/** Attributes from the drag half. Never listeners — Vapor re-attaches every `on*` key spread
 * through `v-bind` on each render, so those are wired statically with `@event` instead. */
const dragAttrs = computed(() => draggable?.attrs.value ?? {});

provideTableRowContext({
  ariaLabelledBy,
  cells,
  drag: draggable,
  hasChildRows,
  isDisabled,
  isExpanded,
  isSelected,
  level,
  rowKey,
  toggle: () => toggleExpanded(rowKey.value),
});

const states = useInteractionStates({ isDisabled: () => isDisabled.value });

// Focus that arrived on its own still has to be recorded, or the roving tab stop and the focus
// ring would disagree about where focus is.
const onFocus = (event: FocusEvent) => {
  states.onFocus();

  if (event.target !== element.value) return;

  keyboard.claimFocus({ columnKey: null, rowKey: rowKey.value });
};

/**
 * A virtualized row reports where it sits in the whole collection, since only a window of the rows
 * is in the DOM for anything to count. One-based, and the header row is row one — which is why the
 * body's first row is two. A tree grid reports depth instead, exactly as React Aria does.
 */
const virtualizer = useTableVirtualizerContext();

const ariaRowIndex = computed(() => {
  if (!virtualizer || isTree.value) return undefined;

  const index = collection.rows.getIndex(rowKey.value);

  return index < 0 ? undefined : index + 2;
});

const onClick = (event: MouseEvent) => {
  if (isDisabled.value || selectionMode.value === "none") return;
  if (isTableCellControl(event.target)) return;

  selection.select(rowKey.value, {
    isCtrlPressed: event.ctrlKey || event.metaKey,
    isShiftPressed: event.shiftKey,
  });
};
</script>

<template>
  <component
    :is="virtualizer ? 'div' : 'tr'"
    v-if="dropIndicator && !dropIndicator.isHidden.value"
    role="row"
    :style="{ height: 0 }"
  >
    <component
      :is="virtualizer ? 'div' : 'td'"
      :colspan="virtualizer ? undefined : columnCount"
      role="gridcell"
      :style="{ padding: 0 }"
    >
      <div
        ref="dropIndicatorElement"
        v-bind="dropIndicator.attrs.value"
        role="button"
        :style="visuallyHiddenStyle"
        @click="dropIndicator.handlers.onClick()"
      />
    </component>
  </component>
  <component
    :is="virtualizer ? 'div' : 'tr'"
    ref="element"
    v-bind="dragAttrs"
    :aria-disabled="isDisabled || undefined"
    :aria-expanded="isTree && hasChildRows ? isExpanded : undefined"
    :aria-labelledby="ariaLabelledBy || undefined"
    :aria-level="isTree ? level : undefined"
    :aria-posinset="isTree ? position.posinset : undefined"
    :aria-rowindex="ariaRowIndex"
    :aria-selected="selectionMode === 'none' ? undefined : isSelected"
    :aria-setsize="isTree ? position.setsize : undefined"
    :class="composeSlotClassName(slots.row, props.class)"
    :data-collection="collectionId"
    :data-disabled="dataAttr(isDisabled)"
    :data-dragging="dataAttr(isDragging)"
    :data-drop-target="dataAttr(isDropTarget)"
    :data-expanded="dataAttr(isExpanded)"
    :data-focus-visible="dataAttr(states.isFocusVisible.value)"
    :data-focused="dataAttr(states.isFocused.value)"
    :data-has-child-items="dataAttr(hasChildRows)"
    :data-hovered="dataAttr(states.isHovered.value)"
    :data-key="rowKey"
    :data-level="level"
    :data-pressed="dataAttr(states.isPressed.value)"
    :data-selected="dataAttr(isSelected)"
    :data-selection-mode="selectionMode === 'none' ? undefined : selectionMode"
    data-slot="table-row"
    role="row"
    :style="{ '--table-row-level': level }"
    :tabindex="keyboard.rowTabIndex(rowKey)"
    @blur="states.onBlur"
    @click="onClick"
    @drag="draggable?.handlers.onDrag($event)"
    @dragend="draggable?.handlers.onDragend($event)"
    @dragstart="draggable?.handlers.onDragstart($event)"
    @focus="onFocus"
    @pointerdown="states.onPointerdown"
    @pointerenter="states.onPointerenter"
    @pointerleave="states.onPointerleave"
  >
    <slot
      :allows-dragging="allowsDragging"
      :has-child-rows="hasChildRows"
      :is-disabled="isDisabled"
      :is-dragging="isDragging"
      :is-drop-target="isDropTarget"
      :is-expanded="isExpanded"
      :is-focus-visible="states.isFocusVisible.value"
      :is-focused="states.isFocused.value"
      :is-hovered="states.isHovered.value"
      :is-pressed="states.isPressed.value"
      :is-selected="isSelected"
      :selection-mode="selectionMode"
    />
  </component>
</template>
