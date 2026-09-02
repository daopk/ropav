<script setup lang="ts" vapor>
import type { TableCellProps, TableCellSlotProps } from "./table.types";

import { computed, shallowRef, watch } from "vue";

import { useId } from "../../composables/use-id";
import { useInteractionStates } from "../../composables/use-interaction-states";
import { dataAttr } from "../../utils/assertion";
import { composeSlotClassName } from "../../utils/compose";
import { getCollectionTextValue } from "../../utils/text-value";
import { useVirtualizerItem } from "../virtualizer/use-virtualizer-item";

import {
  useTableContext,
  useTableGridContext,
  useTableRowContext,
  useTableVirtualizerContext,
} from "./table.context";
import { tableCellId } from "./use-table-collection";

const props = defineProps<TableCellProps>();

defineSlots<{ default?: (props: TableCellSlotProps) => unknown }>();

const { slots } = useTableContext();
const { collection, collectionId, keyboard, selection, tableId, treeColumn } =
  useTableGridContext();
const { cells, claimCellIndex, hasChildRows, isExpanded, level, rowKey } = useTableRowContext();

// A cell has no identity of its own in the public API — it is the nth cell of its row — so the
// registration key is internal and the rendered key is derived from the column it lands under.
const cellKey = useId();

const element = shallowRef<HTMLElement | null>(null);

watch(
  element,
  (current, _previous, onCleanup) => {
    if (!current) return;

    onCleanup(
      cells.register(cellKey.value, {
        element: () => element.value,
        textValue: () => props.textValue ?? getCollectionTextValue(element.value),
      }),
    );
  },
  { flush: "post", immediate: true },
);

// Which column this cell sits under, exactly as React Aria pairs the nth cell with the nth
// column. The registry answers once the registration settles at the end of the first tick; until
// then the cell's place in setup order stands in, so the first render is already complete.
const claimedIndex = claimCellIndex();
const index = computed(() => {
  const registered = cells.indexOf(cellKey.value);

  return registered < 0 ? claimedIndex : registered;
});
const columnKey = computed(() => (index.value < 0 ? null : collection.columns.keyAt(index.value)));

const isRowHeader = computed(
  () => columnKey.value != null && collection.rowHeaderColumnKeys.value.has(columnKey.value),
);

// Only a row header cell carries an id, because only that id is pointed at — by the row's
// `aria-labelledby`. React Aria puts a generated id on every other cell that nothing reads.
const cellId = computed(() =>
  isRowHeader.value && columnKey.value != null
    ? tableCellId(tableId.value, rowKey.value, columnKey.value)
    : undefined,
);

const isSelected = computed(() => selection.isSelected(rowKey.value));
const isDisabled = computed(() => selection.isDisabled(rowKey.value));

// The stylesheet indents this one cell by `--table-row-level`, which is what makes a tree read as
// a tree; every other cell in the row stays flush.
const isTreeColumn = computed(
  () => treeColumn.value != null && columnKey.value === treeColumn.value,
);

// The stylesheet draws the cell's focus ring from `data-focus-visible`; its pseudo-class branch
// is never reached, the same as everywhere else in the design system.
const states = useInteractionStates({ isDisabled: () => isDisabled.value });

const onFocus = (event: FocusEvent) => {
  states.onFocus();

  if (event.target !== element.value) return;

  keyboard.claimFocus({ columnKey: columnKey.value, rowKey: rowKey.value });
};

/**
 * Virtualized, the cell carries the column's width and offset itself, as the row does its own.
 *
 * The geometry is found by the cell the row and the column meet at, which means the row has to
 * carry the `id` its item was keyed by — that key is half of the pair.
 */
const virtualizer = useTableVirtualizerContext();

const layoutInfo = computed(() => {
  if (!virtualizer || columnKey.value == null) return null;

  const collection = virtualizer.collection.value;

  return virtualizer.getLayoutInfo(collection.cellKey(rowKey.value, columnKey.value));
});

const parentLayoutInfo = computed(() =>
  virtualizer ? virtualizer.getLayoutInfo(rowKey.value) : null,
);

const placement = virtualizer
  ? useVirtualizerItem({
      element,
      layoutInfo: () => layoutInfo.value,
      parentLayoutInfo: () => parentLayoutInfo.value,
    })
  : null;
</script>

<template>
  <component
    :is="virtualizer ? 'div' : 'td'"
    :id="cellId"
    ref="element"
    :aria-colindex="virtualizer && index >= 0 ? index + 1 : undefined"
    :class="composeSlotClassName(slots.cell, props.class)"
    :data-collection="collectionId"
    :data-column-index="index < 0 ? undefined : index"
    :data-disabled="dataAttr(isDisabled)"
    :data-expanded="dataAttr(isExpanded)"
    :data-focus-visible="dataAttr(states.isFocusVisible.value)"
    :data-focused="dataAttr(states.isFocused.value)"
    :data-has-child-items="dataAttr(hasChildRows)"
    :data-key="columnKey == null ? undefined : `${rowKey}:${columnKey}`"
    :data-level="level"
    :data-pressed="dataAttr(states.isPressed.value)"
    :data-selected="dataAttr(isSelected)"
    data-slot="table-cell"
    :data-tree-column="dataAttr(isTreeColumn)"
    :role="isRowHeader ? 'rowheader' : 'gridcell'"
    :style="placement?.style.value"
    :tabindex="keyboard.cellTabIndex(rowKey, columnKey)"
    @blur="states.onBlur"
    @focus="onFocus"
    @pointerdown="states.onPointerdown"
  >
    <slot
      :has-child-rows="hasChildRows"
      :is-disabled="isDisabled"
      :is-expanded="isExpanded"
      :is-selected="isSelected"
      :is-tree-column="isTreeColumn"
    />
  </component>
</template>
