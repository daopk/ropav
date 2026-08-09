<script setup lang="ts" vapor>
import type {TableHeaderProps, TableHeaderSlotProps} from "./table.types";

import {computed} from "vue";

import {composeSlotClassName} from "../../utils/compose";

import TableVirtualizerItem from "./table-virtualizer-item.vue";
import {useTableContext, useTableGridContext, useTableVirtualizerContext} from "./table.context";

const props = defineProps<TableHeaderProps>();

defineSlots<{default?: (props: TableHeaderSlotProps) => unknown}>();

const {slots} = useTableContext();

// React Aria's `useTableOptions().allowsDragging`, handed to the slot rather than to a hook:
// the header renders an extra leading column for the drag handles, and repeating the condition
// the caller already gave `useDragAndDrop` would be a second place to get it wrong.
const {dragState} = useTableGridContext();
const allowsDragging = computed(() => dragState != null);

/**
 * Virtualized, the header is the one part of the table that is always rendered: it is sticky, so
 * it is on screen at an offset the visible rectangle does not describe.
 *
 * Its own row is not wrapped, matching React Aria — the columns inside it are positioned against
 * the header's wrapper, and a second wrapper in between would only add a box to walk past.
 */
const virtualizer = useTableVirtualizerContext();

const layoutInfo = computed(() =>
  virtualizer ? virtualizer.getLayoutInfo(virtualizer.collection.value.headerKey) : null,
);
</script>

<template>
  <TableVirtualizerItem :layout-info="layoutInfo">
    <component
      :is="virtualizer ? 'div' : 'thead'"
      :class="composeSlotClassName(slots.header, props.class)"
      data-slot="table-header"
      role="rowgroup"
    >
      <component
        :is="virtualizer ? 'div' : 'tr'"
        :aria-rowindex="virtualizer ? 1 : undefined"
        role="row"
      >
        <slot :allows-dragging="allowsDragging" />
      </component>
    </component>
  </TableVirtualizerItem>
</template>
