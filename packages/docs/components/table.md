---
title: Table
description: Rows and columns, with selection, sorting and resizing as parts rather than flags.
outline: [2, 3]
---

# Table

A table here is a real one — `TableContent` renders a `<table>` with a header, body and rows — and
everything beyond that is a part you add. Selection, sorting, resizing, expanding, dragging and
loading more are each opt-in, so a plain table costs nothing.

```ts
import { Table, TableBody, TableCell, TableColumn, TableRow } from "ropav";
```

## The frame

`Table` is the frame, `TableScrollContainer` is what scrolls, and `TableContent` is the table
itself. Keeping them apart is what lets the header stay put while the body scrolls, and what
gives a wide table somewhere to overflow that is not the page.

<Demo title="table-basic.vue">
<DemoTableBasic />

<template #code>

<<< @/.vitepress/theme/demos/table-basic.vue

</template>
</Demo>

One column should carry `is-row-header`: it is the cell that names the row, and what a screen
reader reads back when the reader moves down a column.

## Selection

`selection-mode` on `TableContent` turns it on, and `TableSelectionCheckbox` is the box to put in
the first cell of the header and of each row. The selected keys are row `id`s, controlled or
uncontrolled like any other value here.

## Sorting

`allows-sorting` on a `TableColumn` makes its header a button, and `sort-descriptor` on
`TableContent` says which column is sorted and which way. The table does not sort your data — it
reports what was asked for and renders what you give back, which is the only version that works
once the data is on a server.

## Resizing

`TableResizableContainer` and `TableColumnResizer` add column resizing;
`width`, `min-width` and `max-width` on a column set its bounds.

## Long tables

`TableLoadMore` renders a sentinel at the end of the body that reports when it comes into view.
For a table long enough that the rows themselves are the cost, reach for the virtualizer instead.

## API

<Api family="table" />
