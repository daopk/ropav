<script setup lang="ts" vapor>
import type { TableSortableColumnHeaderProps } from "@/components/table";

import {
  TableColumn,
  TableContent,
  TableHeader,
  TableRoot,
  TableSortableColumnHeader,
} from "@/components/table";

// `showIndicator` is declared with an explicit `undefined` default: a Boolean prop with no
// default is cast to `false`, and forwarding that would turn the indicator off in every test
// that never asked about it.
const props = withDefaults(defineProps<TableSortableColumnHeaderProps>(), {
  showIndicator: undefined,
});
</script>

<template>
  <TableRoot>
    <TableContent aria-label="Team">
      <TableHeader>
        <TableColumn id="name">
          <TableSortableColumnHeader
            :show-indicator="props.showIndicator"
            :sort-direction="props.sortDirection"
          >
            Name
          </TableSortableColumnHeader>
        </TableColumn>
      </TableHeader>
    </TableContent>
  </TableRoot>
</template>
