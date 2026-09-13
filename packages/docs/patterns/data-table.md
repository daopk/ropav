---
title: Data table
description: Search, bulk actions, sorting, selection and pagination around one table.
outline: [2, 3]
---

# Data table

A table on its own shows rows. A table screen is the row of controls above it, the sorting and
selection the header carries, and the page footer below — four families arranged around
[Table](/components/table), with every piece of state owned by your component rather than by the
table. The screen around it is the [app shell](/patterns/app-shell); see
[composing patterns](/patterns/#composing-patterns) for how the two fit.

```ts
import { Pagination, SearchField, Table, TableContent, TableScrollContainer, Toolbar } from "ropav";
```

<Demo full open title="data-table.vue">
<PatternDataTable />

<template #code>

<<< @/.vitepress/theme/patterns/data-table.vue

</template>
</Demo>

## Where the props go

`Table` is the frame and takes `class` and `variant`, `TableScrollContainer` is what scrolls, and
`TableContent` is the `<table>` — which is where `aria-label`, `selection-mode`,
`v-model:selected-keys` and `v-model:sort-descriptor` live. Putting them on `Table` compiles and
does nothing. A table wider than the room it is given scrolls in that middle layer rather than
widening everything around it.

## The table does not sort

A sortable column reports a `sort-descriptor` and renders the rows it is handed. Slicing for the
current page works the same way — which is why the search, the sort and the page above are three
computeds over one array, and why the row count the footer reports is the filtered one.

## The search field is not in the toolbar

[Toolbar](/components/toolbar) makes its controls one tab stop and moves focus between them with
the arrow keys. A text field inside it loses the caret to that, so the search sits beside the
toolbar rather than in it.

## Nothing to show

`TableBody` has an `#empty` slot, which renders in place of the rows when the collection is empty.
A [Skeleton](/components/skeleton) goes in the same slot while the first page is loading.

## Accessibility

- `TableContent` needs an `aria-label`; so does [Pagination](/components/pagination), because two
  sets of controls around one list otherwise report the same landmark twice.
- One column carries `is-row-header`, so a screen reader names each row by its member rather than
  reading the row number.
- `PaginationPrevious` and `PaginationNext` keep text beside their icons — the icon alone leaves
  the control unnamed.
