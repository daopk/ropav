---
title: Async states
description: Loading, failed and empty around one collection, and the rule that only one of them shows.
outline: [2, 3]
---

# Async states

Every screen that fetches something has four renders, not one: the wait, the failure, the empty
answer, and the rows. [Skeleton](/components/skeleton) stands in for the wait,
[Alert](/components/alert) carries the failure beside the retry, and
[EmptyState](/components/empty-state) says that nothing arrived rather than leaving a blank.

```ts
import { Alert, Button, Card, EmptyState, Skeleton, Toolbar } from "ropav";
```

<Demo full open title="async.vue">
<PatternAsync />

<template #code>

<<< @/.vitepress/theme/patterns/async.vue

</template>
</Demo>

## One of the four, never two

The states are ordered, not independent: loading wins, then the failure, then the empty
collection, and the rows are what is left. Written as separate conditions they overlap — an empty
array is empty while the first request is still in flight, so a skeleton and an empty state render
together and the screen says two things at once. A `v-if` chain is what keeps that from happening.

## An error is not a toast

A failed load belongs in the page, next to the control that retries it, because the reader has to
be able to act on it after reading it. A toast is for something that already happened and needs no
answer — a save that worked. Queue one for that and leave the failure where it can be read twice.

## Pending keeps the button reachable

`is-pending` blocks the button being activated again but leaves it focusable, so a screen reader
can still land on the control and hear what it is. `is-disabled` takes it out of the tab order
instead, which moves focus somewhere unannounced at the moment the reader is waiting to be told
what changed.

## Accessibility

- A skeleton is decoration. It carries no text, so a reader is told nothing while it shows —
  which is why the retry and the empty state below carry real sentences rather than an icon.
- The skeleton rows are sized to the text they stand in for, so nothing jumps when the answer
  arrives and the reader does not lose their place.
- `Toolbar` is one stop in the tab order with the arrow keys moving inside it, so a row of load
  controls does not cost three tabs to get past.
