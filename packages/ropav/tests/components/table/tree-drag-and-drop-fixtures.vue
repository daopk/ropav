<script setup lang="ts" vapor>
import type { CollectionKey } from "@/composables/use-collection";
import type {
  DragKey,
  DroppableCollectionOnItemDropEvent,
  DroppableCollectionReorderEvent,
} from "@/utils/dnd-types";

import { computed, shallowRef } from "vue";

import { Button } from "@/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableContent,
  TableDragHandle,
  TableExpandTrigger,
  TableHeader,
  TableRow,
} from "@/components/table";
import { useDragAndDrop } from "@/composables/use-drag-and-drop";

interface TreeNode {
  id: string;
  title: string;
  children: TreeNode[];
}

/** A tree grid whose rows reorder, which is where the nesting-aware paths are exercised. */
const props = withDefaults(
  defineProps<{
    defaultExpandedKeys?: CollectionKey[];
    onItemDrop?: (event: DroppableCollectionOnItemDropEvent) => void;
    onReorder?: (event: DroppableCollectionReorderEvent) => void;
  }>(),
  { defaultExpandedKeys: () => [], onItemDrop: undefined, onReorder: undefined },
);

const data: TreeNode[] = [
  {
    children: [
      { children: [], id: "report", title: "Report" },
      { children: [], id: "budget", title: "Budget" },
    ],
    id: "documents",
    title: "Documents",
  },
  { children: [], id: "photos", title: "Photos" },
];

const expanded = shallowRef(new Set<CollectionKey>(props.defaultExpandedKeys));

interface FlatRow {
  node: TreeNode;
  level: number;
  parentKey?: CollectionKey;
}

const flatten = (nodes: TreeNode[], level = 0, parentKey?: CollectionKey): FlatRow[] =>
  nodes.flatMap((node) => [
    { level, node, parentKey },
    ...(expanded.value.has(node.id) ? flatten(node.children, level + 1, node.id) : []),
  ]);

const rows = computed(() => flatten(data));

const { dragAndDropHooks } = useDragAndDrop({
  getItems: (keys: Set<DragKey>) => [...keys].map((key) => ({ "text/plain": String(key) })),
  // Dropping *onto* a row is only ever offered when there is something to do with it, so a
  // folder tree has to say so — without this the drag can only ever land between rows.
  onItemDrop: (event) => props.onItemDrop?.(event),
  onReorder: (event) => props.onReorder?.(event),
});

defineExpose({ expanded });
</script>

<template>
  <Table>
    <TableContent
      aria-label="Files"
      :drag-and-drop-hooks="dragAndDropHooks"
      :expanded-keys="[...expanded]"
      selection-mode="multiple"
      tree-column="name"
      @expanded-change="expanded = $event"
    >
      <TableHeader>
        <TableColumn id="drag" />
        <TableColumn id="name" is-row-header>Name</TableColumn>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="row of rows"
          :id="row.node.id"
          :key="row.node.id"
          :has-child-rows="row.node.children.length > 0"
          :level="row.level"
          :parent-key="row.parentKey"
          :text-value="row.node.title"
        >
          <TableCell>
            <TableDragHandle>
              <Button is-icon-only size="sm" variant="ghost">grip</Button>
            </TableDragHandle>
          </TableCell>
          <TableCell v-slot="{ hasChildRows, isTreeColumn }" :text-value="row.node.title">
            <TableExpandTrigger v-if="hasChildRows && isTreeColumn">
              <Button is-icon-only size="sm" variant="ghost">chevron</Button>
            </TableExpandTrigger>
            <span>{{ row.node.title }}</span>
          </TableCell>
        </TableRow>
      </TableBody>
    </TableContent>
  </Table>
</template>
