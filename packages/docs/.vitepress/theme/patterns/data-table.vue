<script setup lang="ts">
import type { CollectionSelection, TableSortDescriptor } from "ropav";

import {
  Button,
  Chip,
  ChipLabel,
  Dropdown,
  DropdownMenu,
  DropdownPopover,
  EmptyState,
  Label,
  MenuItem,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationNextIcon,
  PaginationPrevious,
  PaginationPreviousIcon,
  PaginationSummary,
  SearchField,
  SearchFieldClearButton,
  SearchFieldGroup,
  SearchFieldInput,
  SearchFieldSearchIcon,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableContent,
  TableFooter,
  TableHeader,
  TableRow,
  TableScrollContainer,
  TableSelectionCheckbox,
  TableSortableColumnHeader,
  Toolbar,
} from "ropav";
import { computed, shallowRef, watch } from "vue";

const PAGE_SIZE = 4;

const STATUS_COLOR = { Active: "success", Invited: "warning", Suspended: "danger" } as const;

interface Member {
  id: string;
  name: string;
  role: string;
  status: keyof typeof STATUS_COLOR;
}

const members: Member[] = [
  { id: "1", name: "Ada Lovelace", role: "Owner", status: "Active" },
  { id: "2", name: "Grace Hopper", role: "Admin", status: "Active" },
  { id: "3", name: "Katherine Johnson", role: "Engineer", status: "Active" },
  { id: "4", name: "Radia Perlman", role: "Engineer", status: "Invited" },
  { id: "5", name: "Barbara Liskov", role: "Engineer", status: "Active" },
  { id: "6", name: "Margaret Hamilton", role: "Admin", status: "Suspended" },
  { id: "7", name: "Frances Allen", role: "Engineer", status: "Invited" },
  { id: "8", name: "Karen Spärck Jones", role: "Researcher", status: "Active" },
  { id: "9", name: "Shafi Goldwasser", role: "Researcher", status: "Active" },
];

const columns = [
  { id: "name", isRowHeader: true, name: "Member" },
  { id: "role", name: "Role" },
  { id: "status", name: "Status" },
];

const page = shallowRef(1);
const query = shallowRef("");
const selectedKeys = shallowRef<CollectionSelection>(new Set());
const sortDescriptor = shallowRef<TableSortDescriptor>({ column: "name", direction: "ascending" });

const matched = computed(() => {
  const needle = query.value.trim().toLowerCase();

  return members.filter((member) => `${member.name} ${member.role}`.toLowerCase().includes(needle));
});

// The table reports what was asked for and renders what it is handed; the ordering is yours.
const sorted = computed(() => {
  const { column, direction } = sortDescriptor.value;

  return [...matched.value].sort((a, b) => {
    const order = String(a[column as keyof Member]).localeCompare(
      String(b[column as keyof Member]),
    );

    return direction === "descending" ? -order : order;
  });
});

const pageCount = computed(() => Math.max(1, Math.ceil(sorted.value.length / PAGE_SIZE)));

const pages = computed(() => Array.from({ length: pageCount.value }, (_, index) => index + 1));

const rows = computed(() =>
  sorted.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE),
);

const selectedCount = computed(() =>
  selectedKeys.value === "all" ? sorted.value.length : selectedKeys.value.size,
);

// A narrowed search otherwise leaves the reader on a page that no longer exists.
watch(pageCount, (count) => {
  page.value = Math.min(page.value, count);
});
</script>

<template>
  <div class="screen">
    <Toolbar aria-label="Member actions" class="screen__header">
      <SearchField v-model:value="query" aria-label="Search members">
        <SearchFieldGroup>
          <SearchFieldSearchIcon />
          <SearchFieldInput placeholder="Search members…" />
          <SearchFieldClearButton />
        </SearchFieldGroup>
      </SearchField>

      <Button :is-disabled="selectedCount === 0" variant="secondary">
        Export{{ selectedCount ? ` (${selectedCount})` : "" }}
      </Button>

      <Dropdown>
        <Button variant="secondary">Actions</Button>

        <DropdownPopover>
          <DropdownMenu>
            <MenuItem id="invite" text-value="Resend invite">
              <Label>Resend invite</Label>
            </MenuItem>
            <MenuItem id="suspend" text-value="Suspend" variant="danger">
              <Label>Suspend</Label>
            </MenuItem>
          </DropdownMenu>
        </DropdownPopover>
      </Dropdown>
    </Toolbar>

    <Table class="frame">
      <TableScrollContainer>
        <TableContent
          v-model:selected-keys="selectedKeys"
          v-model:sort-descriptor="sortDescriptor"
          aria-label="Members"
          class="table"
          selection-mode="multiple"
        >
          <TableHeader>
            <TableColumn><TableSelectionCheckbox /></TableColumn>
            <TableColumn
              v-for="column in columns"
              :id="column.id"
              :key="column.id"
              v-slot="{ sortDirection }"
              allows-sorting
              :is-row-header="column.isRowHeader"
            >
              <TableSortableColumnHeader :sort-direction="sortDirection">
                {{ column.name }}
              </TableSortableColumnHeader>
            </TableColumn>
          </TableHeader>

          <TableBody>
            <template #empty>
              <EmptyState>No members match that search.</EmptyState>
            </template>

            <TableRow v-for="member in rows" :id="member.id" :key="member.id">
              <TableCell><TableSelectionCheckbox variant="secondary" /></TableCell>
              <TableCell>{{ member.name }}</TableCell>
              <TableCell>{{ member.role }}</TableCell>
              <TableCell>
                <Chip :color="STATUS_COLOR[member.status]" variant="soft">
                  <ChipLabel>{{ member.status }}</ChipLabel>
                </Chip>
              </TableCell>
            </TableRow>
          </TableBody>
        </TableContent>
      </TableScrollContainer>

      <TableFooter>
        <Pagination aria-label="Members" size="sm">
          <PaginationSummary>{{ sorted.length }} members</PaginationSummary>

          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious :is-disabled="page === 1" @click="page -= 1">
                <PaginationPreviousIcon />
                <span>Previous</span>
              </PaginationPrevious>
            </PaginationItem>

            <PaginationItem v-for="entry in pages" :key="entry">
              <PaginationLink :is-active="entry === page" @click="page = entry">
                {{ entry }}
              </PaginationLink>
            </PaginationItem>

            <PaginationItem>
              <PaginationNext :is-disabled="page === pageCount" @click="page += 1">
                <span>Next</span>
                <PaginationNextIcon />
              </PaginationNext>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </TableFooter>
    </Table>
  </div>
</template>

<style scoped>
.screen {
  display: flex;
  flex-direction: column;
  gap: calc(var(--rp-spacing) * 4);
}

/* A toolbar sizes itself to its controls; widening it and letting the first column take the
   slack puts the search field across the row with the actions at its end. */
.screen__header {
  width: 100%;
  grid-template-columns: minmax(0, 1fr);
  gap: calc(var(--rp-spacing) * 3);
}

/* Enough room for the empty state to stand in, rather than collapsing the body to one line. */
.frame {
  min-height: calc(var(--rp-spacing) * 56);
}

.table {
  height: 100%;
  min-width: calc(var(--rp-spacing) * 120);
}
</style>
