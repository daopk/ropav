<script setup lang="ts" vapor>
import type {TableBodyProps} from "./table.types";

import {computed, onMounted, shallowRef} from "vue";

import {dataAttr} from "../../utils/assertion";
import {composeSlotClassName} from "../../utils/compose";

import {useTableContext, useTableGridContext} from "./table.context";

const props = defineProps<TableBodyProps>();

defineSlots<{default?: () => unknown; empty?: () => unknown}>();

const {slots} = useTableContext();
const {collection} = useTableGridContext();

// Rows register post-flush, so the collection reads as empty during the first render even when
// it is not. Waiting for the mount keeps the empty state from mounting and unmounting in one
// tick — invisible, but it would still run whatever that slot does on the way past.
const hasMounted = shallowRef(false);

onMounted(() => {
  hasMounted.value = true;
});

const isEmpty = computed(() => collection.rows.size.value === 0);
const showsEmptyState = computed(() => hasMounted.value && isEmpty.value);

// The placeholder row spans the whole grid, so it needs the live column count rather than a
// guess. One is the floor: `colspan="0"` means "to the end of the section" in some engines.
const columnCount = computed(() => Math.max(1, collection.columns.size.value));
</script>

<template>
  <tbody
    :class="composeSlotClassName(slots.body, props.class)"
    :data-empty="dataAttr(isEmpty)"
    data-slot="table-body"
    role="rowgroup"
  >
    <slot />
    <tr v-if="showsEmptyState" role="row">
      <td :colspan="columnCount" role="rowheader">
        <slot name="empty" />
      </td>
    </tr>
  </tbody>
</template>
