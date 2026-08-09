<script setup lang="ts" vapor>
import type {TableRowProps, TableRowSlotProps} from "./table.types";
import type {TableCellMeta} from "../../composables/use-table-collection";

import {computed, shallowRef, watch} from "vue";

import {useId} from "../../composables/use-id";
import {useInteractionStates} from "../../composables/use-interaction-states";
import {
  createTableRegistry,
  isTableCellControl,
  tableCellId,
} from "../../composables/use-table-collection";
import {dataAttr} from "../../utils/assertion";
import {composeSlotClassName} from "../../utils/compose";

import {provideTableRowContext, useTableContext, useTableGridContext} from "./table.context";

const props = defineProps<TableRowProps>();

defineSlots<{default?: (props: TableRowSlotProps) => unknown}>();

const {slots} = useTableContext();
const {collection, collectionId, keyboard, selection, tableId} = useTableGridContext();

// Falls back to a generated key so a row without an `id` still has a stable identity.
const generatedKey = useId();
const rowKey = computed(() => props.id ?? generatedKey.value);

const cells = createTableRegistry<TableCellMeta>();

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

provideTableRowContext({ariaLabelledBy, cells, rowKey});

const selectionMode = computed(() => selection.selectionMode.value);
const isSelected = computed(() => selection.isSelected(rowKey.value));
const isDisabled = computed(() => selection.isDisabled(rowKey.value));

const states = useInteractionStates({isDisabled: () => isDisabled.value});

// Focus that arrived on its own still has to be recorded, or the roving tab stop and the focus
// ring would disagree about where focus is.
const onFocus = (event: FocusEvent) => {
  states.onFocus();

  if (event.target !== element.value) return;

  keyboard.claimFocus({columnKey: null, rowKey: rowKey.value});
};

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
  <tr
    ref="element"
    :aria-disabled="isDisabled || undefined"
    :aria-labelledby="ariaLabelledBy || undefined"
    :aria-selected="selectionMode === 'none' ? undefined : isSelected"
    :class="composeSlotClassName(slots.row, props.class)"
    :data-collection="collectionId"
    :data-disabled="dataAttr(isDisabled)"
    :data-focus-visible="dataAttr(states.isFocusVisible.value)"
    :data-focused="dataAttr(states.isFocused.value)"
    :data-hovered="dataAttr(states.isHovered.value)"
    :data-key="rowKey"
    data-level="1"
    :data-pressed="dataAttr(states.isPressed.value)"
    :data-selected="dataAttr(isSelected)"
    :data-selection-mode="selectionMode === 'none' ? undefined : selectionMode"
    data-slot="table-row"
    role="row"
    :style="{'--table-row-level': 1}"
    :tabindex="keyboard.rowTabIndex(rowKey)"
    @blur="states.onBlur"
    @click="onClick"
    @focus="onFocus"
    @pointerdown="states.onPointerdown"
    @pointerenter="states.onPointerenter"
    @pointerleave="states.onPointerleave"
  >
    <slot
      :is-disabled="isDisabled"
      :is-focus-visible="states.isFocusVisible.value"
      :is-focused="states.isFocused.value"
      :is-hovered="states.isHovered.value"
      :is-pressed="states.isPressed.value"
      :is-selected="isSelected"
      :selection-mode="selectionMode"
    />
  </tr>
</template>
