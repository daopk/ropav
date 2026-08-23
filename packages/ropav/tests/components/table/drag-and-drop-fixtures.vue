<script setup lang="ts" vapor>
import type { DragKey, DroppableCollectionReorderEvent } from "@/utils/dnd-types";

import { shallowRef } from "vue";

import { Button } from "@/components/button";
import { Table } from "@/components/table";
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
  <Table.Root>
    <Table.Content
      aria-label="Reorderable table"
      :drag-and-drop-hooks="dragAndDropHooks"
      :selection-mode="props.selectionMode"
    >
      <Table.Header v-slot="{ allowsDragging }">
        <Table.Column v-if="allowsDragging" id="drag" />
        <Table.Column id="name" is-row-header>Name</Table.Column>
        <Table.Column id="role">Role</Table.Column>
      </Table.Header>
      <Table.Body>
        <template v-for="name in order" :key="name">
          <Table.DropIndicator :target="{ dropPosition: 'before', key: name, type: 'item' }" />
          <Table.Row :id="name" :text-value="name">
            <Table.Cell>
              <Table.DragHandle>
                <Button is-icon-only size="sm" variant="ghost">grip</Button>
              </Table.DragHandle>
            </Table.Cell>
            <Table.Cell :text-value="name">{{ name }}</Table.Cell>
            <Table.Cell>Engineer</Table.Cell>
          </Table.Row>
        </template>
        <Table.DropIndicator
          :target="{ dropPosition: 'after', key: order[order.length - 1]!, type: 'item' }"
        />
      </Table.Body>
    </Table.Content>
  </Table.Root>
</template>
