<script setup lang="ts" vapor>
import type { TableFixtureUser } from "./fixtures.types";
import type { TableRootProps, TableSortDescriptor } from "@/components/table";
import type { CollectionKey } from "@/composables/use-collection";
import type {
  CollectionSelection,
  DisabledBehavior,
  SelectionBehavior,
  SelectionMode,
} from "@/composables/use-selection-manager";

import {
  TableBody,
  TableCell,
  TableColumn,
  TableContent,
  TableFooter,
  TableHeader,
  TableLoadMore,
  TableLoadMoreContent,
  TableRoot,
  TableRow,
  TableScrollContainer,
  TableSelectionCheckbox,
  TableSortableColumnHeader,
} from "@/components/table";

// Every three-state Boolean declares an explicit `undefined` default: Vue casts an absent
// Boolean prop to `false`, and forwarding that would read as a decision the test never made.
const props = withDefaults(
  defineProps<
    TableRootProps & {
      columnClass?: string;
      disabledKeys?: CollectionKey[];
      disallowEmptySelection?: boolean;
      defaultSelectedKeys?: CollectionKey[];
      disabledBehavior?: DisabledBehavior;
      onSelectionChange?: (keys: CollectionSelection) => void;
      onSortChange?: (descriptor: TableSortDescriptor) => void;
      rowHeaders?: string[];
      selectedKeys?: CollectionKey[];
      selectionBehavior?: SelectionBehavior;
      selectionMode?: SelectionMode;
      sortableColumns?: string[];
      sortDescriptor?: TableSortDescriptor | null;
      users?: TableFixtureUser[];
      isLoading?: boolean;
      onLoadMore?: () => void;
      scrollContainerStyle?: Record<string, string>;
      scrollOffset?: number;
      withFooter?: boolean;
      withLoadMore?: boolean;
      withSelectionColumn?: boolean;
      withSortableHeader?: boolean;
    }
  >(),
  {
    class: undefined,
    columnClass: undefined,
    defaultSelectedKeys: undefined,
    disabledBehavior: undefined,
    disabledKeys: undefined,
    disallowEmptySelection: undefined,
    isLoading: undefined,
    onLoadMore: undefined,
    scrollContainerStyle: undefined,
    scrollOffset: undefined,
    withLoadMore: undefined,
    onSelectionChange: undefined,
    onSortChange: undefined,
    rowHeaders: undefined,
    selectedKeys: undefined,
    selectionBehavior: undefined,
    selectionMode: undefined,
    sortDescriptor: undefined,
    sortableColumns: undefined,
    users: undefined,
    variant: undefined,
    withFooter: undefined,
    withSelectionColumn: undefined,
    withSortableHeader: undefined,
  },
);

const columns = [
  { id: "name", name: "Name" },
  { id: "role", name: "Role" },
  { id: "email", name: "Email" },
];

const defaultUsers: TableFixtureUser[] = [
  { email: "kate@acme.com", id: 4586932, name: "Kate Moore", role: "CEO" },
  { email: "john@acme.com", id: 5273849, name: "John Smith", role: "CTO" },
];
</script>

<template>
  <TableRoot :class="props.class" :variant="props.variant">
    <TableScrollContainer :style="props.scrollContainerStyle">
      <TableContent
        aria-label="Team"
        :default-selected-keys="props.defaultSelectedKeys"
        :disabled-behavior="props.disabledBehavior"
        :disabled-keys="props.disabledKeys"
        :disallow-empty-selection="props.disallowEmptySelection"
        :selected-keys="props.selectedKeys"
        :selection-behavior="props.selectionBehavior"
        :selection-mode="props.selectionMode"
        :sort-descriptor="props.sortDescriptor"
        @selection-change="props.onSelectionChange?.($event)"
        @sort-change="props.onSortChange?.($event)"
      >
        <TableHeader>
          <TableColumn v-if="props.withSelectionColumn" id="selection">
            <TableSelectionCheckbox />
          </TableColumn>
          <TableColumn
            v-for="column of columns"
            :id="column.id"
            :key="column.id"
            v-slot="{ sortDirection }"
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
            <TableCell v-if="props.withSelectionColumn">
              <TableSelectionCheckbox variant="secondary" />
            </TableCell>
            <TableCell>{{ user.name }}</TableCell>
            <TableCell>{{ user.role }}</TableCell>
            <TableCell>{{ user.email }}</TableCell>
          </TableRow>
          <TableLoadMore
            v-if="props.withLoadMore"
            :is-loading="props.isLoading"
            :scroll-offset="props.scrollOffset"
            @load-more="props.onLoadMore?.()"
          >
            <TableLoadMoreContent>Loading</TableLoadMoreContent>
          </TableLoadMore>
        </TableBody>
      </TableContent>
    </TableScrollContainer>
    <TableFooter v-if="props.withFooter">1 to 2 of 2 results</TableFooter>
  </TableRoot>
</template>
