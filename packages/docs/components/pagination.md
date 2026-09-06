---
title: Pagination
description: The controls for moving through a long list a page at a time.
outline: [2, 3]
---

# Pagination

Pagination is the row of page numbers under a long list. It is deliberately all parts and no
state: it renders what you tell it and reports presses, because which pages exist, which is
current and how the ellipsis falls are decisions that belong to the data, not to the control.

```ts
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationSummary,
} from "ropav";
```

`PaginationContent` is the list, `PaginationItem` one entry in it, and `PaginationLink` the
pressable number. `PaginationPrevious` and `PaginationNext` are the ends, `PaginationEllipsis`
stands for the pages that are not shown, and `PaginationSummary` is the "showing 21–40 of 312"
line.

<Demo title="pagination-basic.vue">
<DemoPaginationBasic />

<template #code>

<<< @/.vitepress/theme/demos/pagination-basic.vue

</template>
</Demo>

`is-active` on a link marks the page being viewed; `is-disabled` on the ends stops the reader
walking off either edge.

## Accessibility

- The whole thing is a navigation landmark. `aria-label` defaults to "pagination" and is worth
  overriding whenever there are two sets of controls on one page — above the list and below it —
  because otherwise the same landmark is reported twice with the same name.
- `is-active` renders `aria-current="page"`, so a reader is told where they are rather than only
  seeing it in the highlight.
- The ellipsis is `aria-hidden` — it says nothing, because "…" read aloud between two page
  numbers is noise. `PaginationSummary` is what carries the shape of the list instead.
- Previous and next should say so in text. An arrow alone is announced as an unlabelled button,
  which is why the parts here take a `<span>` beside the icon rather than only the icon.

## API

<Api family="pagination" />
