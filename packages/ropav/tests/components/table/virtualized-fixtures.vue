<script setup lang="ts" vapor>
import { Spinner } from "@/components/spinner";
import {
  TableBody,
  TableCell,
  TableColumn,
  TableContent,
  TableHeader,
  TableLoadMore,
  TableLoadMoreContent,
  Table,
  TableRow,
  TableScrollContainer,
} from "@/components/table";
import { VirtualizerRoot } from "@/components/virtualizer";
import { TableLayout } from "@/utils/virtualizer-table-layout";

export interface VirtualizedUser {
  email: string;
  id: number;
  name: string;
  role: string;
}

const props = withDefaults(
  defineProps<{
    isLoading?: boolean;
    /** Columns that together outgrow the box, so it scrolls sideways as well as down. */
    isWide?: boolean;
    items?: VirtualizedUser[];
    rowSize?: number;
    selectionMode?: "multiple" | "none" | "single";
    withLoadMore?: boolean;
    withoutVirtualizer?: boolean;
  }>(),
  {
    isLoading: undefined,
    isWide: undefined,
    items: (): VirtualizedUser[] => [],
    rowSize: 42,
    selectionMode: "none",
    withLoadMore: undefined,
    withoutVirtualizer: undefined,
  },
);

const emit = defineEmits<{ loadMore: [] }>();
</script>

<template>
  <VirtualizerRoot
    v-if="!props.withoutVirtualizer"
    :layout="TableLayout"
    :layout-options="{ headingSize: props.rowSize, rowSize: props.rowSize }"
  >
    <Table>
      <TableScrollContainer>
        <TableContent
          aria-label="Virtualized users"
          class="h-[500px] w-[700px] overflow-auto"
          :selection-mode="props.selectionMode"
        >
          <TableHeader>
            <TableColumn id="name" is-row-header :min-width="props.isWide ? 400 : 160">
              Name
            </TableColumn>
            <TableColumn id="role" :min-width="props.isWide ? 400 : 220">Role</TableColumn>
            <TableColumn id="email" :min-width="props.isWide ? 400 : 240">Email</TableColumn>
          </TableHeader>
          <TableBody :item-text-value="(item) => item.name" :items="props.items">
            <template #default="{ item }">
              <TableRow :id="item!.id">
                <TableCell>{{ item!.name }}</TableCell>
                <TableCell>{{ item!.role }}</TableCell>
                <TableCell>{{ item!.email }}</TableCell>
              </TableRow>
            </template>
            <template #loader>
              <TableLoadMore
                v-if="props.withLoadMore"
                :is-loading="props.isLoading"
                @load-more="emit('loadMore')"
              >
                <TableLoadMoreContent>
                  <Spinner />
                </TableLoadMoreContent>
              </TableLoadMore>
            </template>
            <template #empty>No users</template>
          </TableBody>
        </TableContent>
      </TableScrollContainer>
    </Table>
  </VirtualizerRoot>

  <Table v-else>
    <TableScrollContainer>
      <TableContent aria-label="Virtualized users" :selection-mode="props.selectionMode">
        <TableHeader>
          <TableColumn id="name" is-row-header>Name</TableColumn>
          <TableColumn id="role">Role</TableColumn>
          <TableColumn id="email">Email</TableColumn>
        </TableHeader>
        <TableBody>
          <TableRow v-for="item of props.items" :id="item.id" :key="item.id">
            <TableCell>{{ item.name }}</TableCell>
            <TableCell>{{ item.role }}</TableCell>
            <TableCell>{{ item.email }}</TableCell>
          </TableRow>
        </TableBody>
      </TableContent>
    </TableScrollContainer>
  </Table>
</template>
