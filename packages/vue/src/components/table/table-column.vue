<script setup lang="ts" vapor>
import type {TableColumnProps} from "./table.types";

import {computed, shallowRef, watch} from "vue";

import {useId} from "../../composables/use-id";
import {tableColumnHeaderId} from "../../composables/use-table-collection";
import {composeSlotClassName} from "../../utils/compose";

import {useTableContext, useTableGridContext} from "./table.context";

const props = defineProps<TableColumnProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useTableContext();
const {collection, collectionId, tableId} = useTableGridContext();

// Falls back to a generated key so a column without an `id` still has a stable identity — the
// same thing React Aria does when a `<Column>` carries no key.
const generatedKey = useId();
const columnKey = computed(() => props.id ?? generatedKey.value);

const element = shallowRef<HTMLElement | null>(null);

// Registered post-flush so the element is attached before the registry asks the DOM where it
// sits. Metadata is handed over as getters, so a later prop change needs no re-registration.
watch(
  element,
  (current, _previous, onCleanup) => {
    if (!current) return;

    onCleanup(
      collection.columns.register(columnKey.value, {
        element: () => element.value,
        isRowHeader: () => Boolean(props.isRowHeader),
      }),
    );
  },
  {flush: "post", immediate: true},
);

const index = computed(() => collection.columns.indexOf(columnKey.value));

// `aria-colindex` is one-based, and is left off entirely until the registration settles rather
// than rendering a zero that would claim a position no column holds.
const ariaColIndex = computed(() => (index.value < 0 ? undefined : index.value + 1));
</script>

<template>
  <th
    :id="tableColumnHeaderId(tableId, columnKey)"
    ref="element"
    :aria-colindex="ariaColIndex"
    :class="composeSlotClassName(slots.column, props.class)"
    :data-collection="collectionId"
    :data-key="columnKey"
    data-slot="table-column"
    role="columnheader"
    :tabindex="-1"
  >
    <slot />
  </th>
</template>
