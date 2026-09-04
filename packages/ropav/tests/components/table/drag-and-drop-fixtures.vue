<script setup lang="ts" vapor>
import type { DragKey, DroppableCollectionReorderEvent } from "@/utils/dnd-types";

import { shallowRef } from "vue";

import { Button } from "@/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableContent,
  TableDragHandle,
  TableDropIndicator,
  TableHeader,
  TableRow,
} from "@/components/table";
import { useDragAndDrop } from "@/composables/use-drag-and-drop";

/**
 * A reorderable table.
 *
 * Only `getItems` and `onReorder` are supplied, which is what switches both halves on: the table
 * can say what its rows are, and it knows what to do with its own rows arriving somewhere new.
 */
const props = withDefaults(
  defineProps<{
    names?: string[];
    selectionMode?: "multiple" | "none" | "single";
    onReorder?: (event: DroppableCollectionReorderEvent) => void;
  }>(),
  {
    names: () => ["Ada", "Grace", "Alan"],
    onReorder: undefined,
    selectionMode: "multiple",
  },
);

const order = shallowRef<string[]>([...props.names]);

const { dragAndDropHooks } = useDragAndDrop({
  getItems: (keys: Set<DragKey>) => [...keys].map((key) => ({ "text/plain": String(key) })),
  onReorder(event) {
    props.onReorder?.(event);

    // Applied so a test can see the table actually change, not just that the handler ran.
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
  <Table>
    <TableContent
      aria-label="Reorderable table"
      :drag-and-drop-hooks="dragAndDropHooks"
      :selection-mode="props.selectionMode"
    >
      <TableHeader v-slot="{ allowsDragging }">
        <TableColumn v-if="allowsDragging" id="drag" />
        <TableColumn id="name" is-row-header>Name</TableColumn>
        <TableColumn id="role">Role</TableColumn>
      </TableHeader>
      <TableBody>
        <template v-for="name in order" :key="name">
          <TableDropIndicator :target="{ dropPosition: 'before', key: name, type: 'item' }" />
          <TableRow :id="name" :text-value="name">
            <TableCell>
              <TableDragHandle>
                <Button is-icon-only size="sm" variant="ghost">grip</Button>
              </TableDragHandle>
            </TableCell>
            <TableCell :text-value="name">{{ name }}</TableCell>
            <TableCell>Engineer</TableCell>
          </TableRow>
        </template>
        <TableDropIndicator
          :target="{ dropPosition: 'after', key: order[order.length - 1]!, type: 'item' }"
        />
      </TableBody>
    </TableContent>
  </Table>
</template>
