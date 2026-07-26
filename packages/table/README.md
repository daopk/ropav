# @ropav/table

Zero-VDOM data table for Vue Vapor, backed by TanStack Table core.

## Install

```bash
pnpm add @ropav/table ropav vue
```

## Use

```vue
<template>
  <Table :data="people" :columns="columns" aria-label="People" />
</template>

<script setup lang="ts" vapor>
import { Table, type TableColumn } from '@ropav/table';
import 'ropav/base.css';
import '@ropav/table/table.css';

interface Person {
  id: string;
  name: string;
  age: number;
}

const people: Person[] = [
  { id: 'ada', name: 'Ada Lovelace', age: 36 },
  { id: 'grace', name: 'Grace Hopper', age: 85 },
];

const columns: TableColumn<Person>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'age', header: 'Age', align: 'end' },
];
</script>
```

Accessor columns are sortable by default. Set `sortable: false` to render a static column. Use
`v-model:sorting` to control sorting, or `defaultSorting` for an uncontrolled initial value:

```vue
<Table
  v-model:sorting="sorting"
  :data="people"
  :columns="columns"
  :get-row-id="(person) => person.id"
/>
```

Set `manualSorting` when the server owns the row order. Header interactions still update the
sorting model, but the package leaves `data` unchanged. Enable `multiSort` to let users add columns
to the sort with Shift+click.

The `header` and `cell` slots support compiled custom markup without dynamic render functions:

```vue
<Table :data="people" :columns="columns">
  <template #cell="{ columnId, row, value }">
    <a v-if="columnId === 'name'" :href="`/people/${row.id}`">{{ value }}</a>
    <template v-else>{{ value }}</template>
  </template>
</Table>
```

The default renderer displays strings, numbers, booleans, bigints, and dates. Use a column
`format` callback for text formatting, or the `cell` slot for custom markup.

## SSR

`Table` is client-only because the Vue Vapor runtime is browser-only. Render it inside your
framework's client-only boundary. The package provides a Node-safe conditional entry so server
imports succeed; attempting to render `Table` on the server throws a clear client-only error.
