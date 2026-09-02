<script setup lang="ts" vapor>
import type { TableFixtureResizableColumn } from "./fixtures.types";
import type { TableColumnSize } from "@/components/table/use-table-column-layout";
import type { CollectionKey } from "@/composables/use-collection";

import {
  TableBody,
  TableCell,
  TableColumn,
  TableColumnResizer,
  TableContent,
  TableHeader,
  TableResizableContainer,
  TableRoot,
  TableRow,
} from "@/components/table";

const props = withDefaults(
  defineProps<{
    columns?: TableFixtureResizableColumn[];
    onResize?: (widths: Map<CollectionKey, TableColumnSize>) => void;
    onResizeEnd?: (widths: Map<CollectionKey, TableColumnSize>) => void;
    onResizeStart?: (widths: Map<CollectionKey, TableColumnSize>) => void;
  }>(),
  {
    columns: undefined,
    onResize: undefined,
    onResizeEnd: undefined,
    onResizeStart: undefined,
  },
);

const defaultColumns: TableFixtureResizableColumn[] = [
  { id: "name", minWidth: 100, name: "Name", withResizer: true },
  { id: "role", minWidth: 100, name: "Role", withResizer: true },
  { id: "email", name: "Email" },
];

const users = [
  { email: "kate@acme.com", id: 4586932, name: "Kate Moore", role: "CEO" },
  { email: "john@acme.com", id: 5273849, name: "John Smith", role: "CTO" },
];
</script>

<template>
  <TableRoot>
    <TableResizableContainer
      @resize="props.onResize?.($event)"
      @resize-end="props.onResizeEnd?.($event)"
      @resize-start="props.onResizeStart?.($event)"
    >
      <TableContent aria-label="Team">
        <TableHeader>
          <TableColumn
            v-for="column of props.columns ?? defaultColumns"
            :id="column.id"
            :key="column.id"
            :default-width="column.defaultWidth"
            :is-row-header="column.id === 'name'"
            :max-width="column.maxWidth"
            :min-width="column.minWidth"
            :width="column.width"
          >
            {{ column.name }}
            <TableColumnResizer v-if="column.withResizer" />
          </TableColumn>
        </TableHeader>
        <TableBody>
          <TableRow v-for="user of users" :id="user.id" :key="user.id">
            <TableCell>{{ user.name }}</TableCell>
            <TableCell>{{ user.role }}</TableCell>
            <TableCell>{{ user.email }}</TableCell>
          </TableRow>
        </TableBody>
      </TableContent>
    </TableResizableContainer>
  </TableRoot>
</template>
