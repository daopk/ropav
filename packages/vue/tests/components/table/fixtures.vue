<script setup lang="ts" vapor>
import type {TableFixtureUser} from "./fixtures.types";
import type {TableRootProps, TableSortDescriptor} from "@/components/table";

import {
  TableBody,
  TableCell,
  TableColumn,
  TableContent,
  TableFooter,
  TableHeader,
  TableRoot,
  TableRow,
  TableScrollContainer,
  TableSortableColumnHeader,
} from "@/components/table";

const props = defineProps<
  TableRootProps & {
    columnClass?: string;
    onSortChange?: (descriptor: TableSortDescriptor) => void;
    rowHeaders?: string[];
    sortableColumns?: string[];
    sortDescriptor?: TableSortDescriptor | null;
    users?: TableFixtureUser[];
    withFooter?: boolean;
    withSortableHeader?: boolean;
  }
>();

const columns = [
  {id: "name", name: "Name"},
  {id: "role", name: "Role"},
  {id: "email", name: "Email"},
];

const defaultUsers: TableFixtureUser[] = [
  {email: "kate@acme.com", id: 4586932, name: "Kate Moore", role: "CEO"},
  {email: "john@acme.com", id: 5273849, name: "John Smith", role: "CTO"},
];
</script>

<template>
  <TableRoot :class="props.class" :variant="props.variant">
    <TableScrollContainer>
      <TableContent
        aria-label="Team"
        :sort-descriptor="props.sortDescriptor"
        @sort-change="props.onSortChange?.($event)"
      >
        <TableHeader>
          <TableColumn
            v-for="column of columns"
            :id="column.id"
            :key="column.id"
            v-slot="{sortDirection}"
            :allows-sorting="(props.sortableColumns ?? []).includes(column.id)"
            :class="props.columnClass"
            :is-row-header="(props.rowHeaders ?? ['name']).includes(column.id)"
          >
            <TableSortableColumnHeader
              v-if="props.withSortableHeader"
              :sort-direction="sortDirection"
            >
              {{ column.name }}
            </TableSortableColumnHeader>
            <template v-else>{{ column.name }}</template>
          </TableColumn>
        </TableHeader>
        <TableBody>
          <template #empty>Nothing here</template>
          <TableRow v-for="user of props.users ?? defaultUsers" :id="user.id" :key="user.id">
            <TableCell>{{ user.name }}</TableCell>
            <TableCell>{{ user.role }}</TableCell>
            <TableCell>{{ user.email }}</TableCell>
          </TableRow>
        </TableBody>
      </TableContent>
    </TableScrollContainer>
    <TableFooter v-if="props.withFooter">1 to 2 of 2 results</TableFooter>
  </TableRoot>
</template>
