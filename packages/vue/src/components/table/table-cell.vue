<script setup lang="ts" vapor>
import type {TableCellProps} from "./table.types";

import {computed, shallowRef, watch} from "vue";

import {useId} from "../../composables/use-id";
import {tableCellId} from "../../composables/use-table-collection";
import {composeSlotClassName} from "../../utils/compose";
import {getCollectionTextValue} from "../../utils/text-value";

import {useTableContext, useTableGridContext, useTableRowContext} from "./table.context";

const props = defineProps<TableCellProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useTableContext();
const {collection, collectionId, tableId} = useTableGridContext();
const {cells, rowKey} = useTableRowContext();

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
  {flush: "post", immediate: true},
);

// Which column this cell sits under, exactly as React Aria pairs the nth cell with the nth
// column. `-1` until the registration settles at the end of the first tick.
const index = computed(() => cells.indexOf(cellKey.value));
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
</script>

<template>
  <td
    :id="cellId"
    ref="element"
    :class="composeSlotClassName(slots.cell, props.class)"
    :data-collection="collectionId"
    :data-column-index="index < 0 ? undefined : index"
    :data-key="columnKey == null ? undefined : `${rowKey}:${columnKey}`"
    data-level="1"
    data-slot="table-cell"
    :role="isRowHeader ? 'rowheader' : 'gridcell'"
    :tabindex="-1"
  >
    <slot />
  </td>
</template>
