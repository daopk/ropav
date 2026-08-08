<script setup lang="ts" vapor>
import type {TableRowProps} from "./table.types";
import type {TableCellMeta} from "../../composables/use-table-collection";

import {computed, shallowRef, watch} from "vue";

import {useId} from "../../composables/use-id";
import {createTableRegistry, tableCellId} from "../../composables/use-table-collection";
import {composeSlotClassName} from "../../utils/compose";

import {provideTableRowContext, useTableContext, useTableGridContext} from "./table.context";

const props = defineProps<TableRowProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useTableContext();
const {collection, collectionId, tableId} = useTableGridContext();

// Falls back to a generated key so a row without an `id` still has a stable identity.
const generatedKey = useId();
const rowKey = computed(() => props.id ?? generatedKey.value);

const cells = createTableRegistry<TableCellMeta>();

provideTableRowContext({cells, rowKey});

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
  },
  {flush: "post", immediate: true},
);

// A row is named by its row header cells, whose ids are derived rather than read back, so the
// reference is known before those cells have registered.
const ariaLabelledBy = computed(() =>
  [...collection.rowHeaderColumnKeys.value]
    .map((columnKey) => tableCellId(tableId.value, rowKey.value, columnKey))
    .join(" "),
);
</script>

<template>
  <tr
    ref="element"
    :aria-labelledby="ariaLabelledBy || undefined"
    :class="composeSlotClassName(slots.row, props.class)"
    :data-collection="collectionId"
    :data-key="rowKey"
    data-level="1"
    data-slot="table-row"
    role="row"
    :style="{'--table-row-level': 1}"
    :tabindex="-1"
  >
    <slot />
  </tr>
</template>
