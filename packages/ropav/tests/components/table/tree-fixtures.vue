<script setup lang="ts" vapor>
import type { CollectionKey } from "@/composables/use-collection";

import { computed, shallowRef } from "vue";

import { Button } from "@/components/button";
import {
  TableBody,
  TableCell,
  TableColumn,
  TableContent,
  TableExpandTrigger,
  TableHeader,
  Table,
  TableRow,
} from "@/components/table";

interface TreeNode {
  id: string;
  title: string;
  type: string;
  children: TreeNode[];
}

const props = withDefaults(
  defineProps<{
    defaultExpandedKeys?: CollectionKey[];
    expandedKeys?: CollectionKey[];
    onExpandedChange?: (keys: Set<CollectionKey>) => void;
    treeColumn?: CollectionKey;
    withoutTreeColumn?: boolean;
  }>(),
  {
    defaultExpandedKeys: undefined,
    expandedKeys: undefined,
    onExpandedChange: undefined,
    treeColumn: "name",
    withoutTreeColumn: undefined,
  },
);

const data: TreeNode[] = [
  {
    children: [
      {
        children: [
          { children: [], id: "3", title: "Weekly Report", type: "File" },
          { children: [], id: "4", title: "Budget", type: "File" },
        ],
        id: "2",
        title: "Project",
        type: "Directory",
      },
    ],
    id: "1",
    title: "Documents",
    type: "Directory",
  },
  {
    children: [
      { children: [], id: "6", title: "Image 1", type: "File" },
      { children: [], id: "7", title: "Image 2", type: "File" },
    ],
    id: "5",
    title: "Photos",
    type: "Directory",
  },
];

const expanded = shallowRef(new Set<CollectionKey>(props.defaultExpandedKeys ?? []));

const openKeys = computed(() =>
  props.expandedKeys === undefined ? expanded.value : new Set<CollectionKey>(props.expandedKeys),
);

interface FlatRow {
  node: TreeNode;
  level: number;
  parentKey?: CollectionKey;
}

/**
 * The rows a tree shows, flattened. A `<tr>` cannot nest inside another `<tr>`, so the caller
 * hands the table a flat list and says how deep each row sits — which is also what the docs
 * recommend for a Vue tree grid.
 */
const flatten = (nodes: TreeNode[], level = 0, parentKey?: CollectionKey): FlatRow[] =>
  nodes.flatMap((node) => [
    { level, node, parentKey },
    ...(openKeys.value.has(node.id) ? flatten(node.children, level + 1, node.id) : []),
  ]);

const rows = computed(() => flatten(data));
</script>

<template>
  <Table>
    <TableContent
      aria-label="Files"
      :default-expanded-keys="props.defaultExpandedKeys"
      :expanded-keys="props.expandedKeys"
      :tree-column="props.withoutTreeColumn ? undefined : props.treeColumn"
      @expanded-change="
        expanded = $event;
        props.onExpandedChange?.($event);
      "
    >
      <TableHeader>
        <TableColumn id="name" is-row-header>Name</TableColumn>
        <TableColumn id="type">Type</TableColumn>
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
          <TableCell v-slot="{ hasChildRows, isTreeColumn }" :text-value="row.node.title">
            <TableExpandTrigger v-if="hasChildRows && isTreeColumn">
              <Button is-icon-only size="sm" variant="ghost">chevron</Button>
            </TableExpandTrigger>
            <span>{{ row.node.title }}</span>
          </TableCell>
          <TableCell>{{ row.node.type }}</TableCell>
        </TableRow>
      </TableBody>
    </TableContent>
  </Table>
</template>
