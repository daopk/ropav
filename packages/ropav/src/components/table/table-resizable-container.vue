<script setup lang="ts" vapor>
import type { CollectionKey } from "../../composables/use-collection";
import type { TableColumnSize } from "../../composables/use-table-column-layout";
import type { TableResizableContainerProps } from "./table.types";

import { computed, onMounted, onUnmounted, shallowRef } from "vue";

import { composeSlotClassName } from "../../utils/compose";

import { provideTableResizableContainerContext, useTableContext } from "./table.context";

const props = defineProps<TableResizableContainerProps>();

const emit = defineEmits<{
  resizeStart: [widths: Map<CollectionKey, TableColumnSize>];
  resize: [widths: Map<CollectionKey, TableColumnSize>];
  resizeEnd: [widths: Map<CollectionKey, TableColumnSize>];
}>();

defineSlots<{ default?: () => unknown }>();

const { slots } = useTableContext();

const element = shallowRef<HTMLElement | null>(null);
const width = shallowRef(0);

/**
 * The columns are laid out against the **scrollable** box rather than the table, so a table wider
 * than its container keeps its columns and scrolls, instead of the columns shrinking to fit.
 * `clientWidth` rather than a bounding rect, because it already excludes the scrollbar.
 */
const measure = () => {
  width.value = element.value?.clientWidth ?? 0;
};

let observer: ResizeObserver | undefined;

onMounted(() => {
  measure();

  // Guarded: jsdom implements no `ResizeObserver`, and a table that never changes size still
  // needs the one measurement above.
  if (typeof ResizeObserver === "undefined" || !element.value) return;

  observer = new ResizeObserver(measure);
  observer.observe(element.value, { box: "border-box" });
});

onUnmounted(() => observer?.disconnect());

provideTableResizableContainerContext({
  onResize: (widths) => emit("resize", widths),
  onResizeEnd: (widths) => emit("resizeEnd", widths),
  onResizeStart: (widths) => emit("resizeStart", widths),
  tableWidth: computed(() => width.value),
});
</script>

<template>
  <div
    ref="element"
    :class="composeSlotClassName(slots.resizableContainer, props.class)"
    data-slot="table-resizable-container"
  >
    <slot />
  </div>
</template>
