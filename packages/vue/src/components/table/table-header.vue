<script setup lang="ts" vapor>
import type {TableHeaderProps} from "./table.types";

import {computed} from "vue";

import {composeSlotClassName} from "../../utils/compose";

import TableVirtualizerItem from "./table-virtualizer-item.vue";
import {useTableContext, useTableVirtualizerContext} from "./table.context";

const props = defineProps<TableHeaderProps>();

defineSlots<{default?: () => unknown}>();

const {slots} = useTableContext();

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
        <slot />
      </component>
    </component>
  </TableVirtualizerItem>
</template>
