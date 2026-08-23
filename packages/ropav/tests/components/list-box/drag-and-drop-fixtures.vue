<script setup lang="ts" vapor>
import type { DragKey, DroppableCollectionReorderEvent } from "@/utils/dnd-types";

import { shallowRef } from "vue";

import { ListBox } from "@/components/list-box";
import { useDragAndDrop } from "@/composables/use-drag-and-drop";

/**
 * A reorderable list box.
 *
 * Only `getItems` and `onReorder` are supplied, which is what switches both halves on: the list
 * can say what its items are, and it knows what to do with its own items arriving somewhere new.
 */
const props = withDefaults(
  defineProps<{
    labels?: string[];
    selectionMode?: "multiple" | "none" | "single";
    onReorder?: (event: DroppableCollectionReorderEvent) => void;
  }>(),
  { labels: () => ["Ada", "Grace", "Alan"], onReorder: undefined, selectionMode: "multiple" },
);

const order = shallowRef<string[]>([...props.labels]);

const { dragAndDropHooks } = useDragAndDrop({
  getItems: (keys: Set<DragKey>) => [...keys].map((key) => ({ "text/plain": String(key) })),
  onReorder(event) {
    props.onReorder?.(event);

    // Applied so a test can see the list actually change, not just that the handler ran.
    const moving = [...event.keys].map(String);
    const rest = order.value.filter((key) => !moving.includes(key));
    const index = rest.indexOf(String(event.target.key));
    const at = event.target.dropPosition === "before" ? index : index + 1;

    order.value = [...rest.slice(0, at), ...moving, ...rest.slice(at)];
  },
});

defineExpose({ order });
</script>

<template>
  <ListBox
    :aria-label="'Reorderable list'"
    :drag-and-drop-hooks="dragAndDropHooks"
    :selection-mode="props.selectionMode"
  >
    <template v-for="label in order" :key="label">
      <ListBox.DropIndicator :target="{ dropPosition: 'before', key: label, type: 'item' }" />
      <ListBox.Item :id="label">{{ label }}</ListBox.Item>
    </template>
    <ListBox.DropIndicator
      :target="{ dropPosition: 'after', key: order[order.length - 1]!, type: 'item' }"
    />
  </ListBox>
</template>
