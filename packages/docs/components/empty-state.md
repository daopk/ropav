---
title: EmptyState
description: The message that stands in for a collection with nothing in it.
outline: [2, 3]
---

# EmptyState

An empty state is what a collection shows when it has nothing to show. It is one element doing one
job — muted text in the place the rows would have been — and it exists so that a
[ListBox](/components/list-box), a [Menu](/components/menu) or a [Table](/components/table) can
hand you the slot and leave the sentence to you.

```ts
import { EmptyState } from "ropav";
```

## In a collection's empty slot

`ListBox`, `Menu`, `DropdownMenu` and `TableBody` each take an `#empty` slot, which renders in
place of the rows while the collection has nothing in it. Nothing has to be switched on: the slot
is used when there is nothing else to use it for.

<Demo title="empty-state-collection.vue">
<DemoEmptyStateCollection />

<template #code>

<<< @/.vitepress/theme/demos/empty-state-collection.vue

</template>
</Demo>

A message that names the reason is worth more than one that names the state. "Nobody matches that
search" tells the reader their query was the problem; "No results" leaves them to work out whether
anything was ever there.

## The default is a fallback

`<EmptyState />` with nothing inside reads "No results found". That default is slot fallback
content rather than a check on what was handed in, because inspecting a slot means executing it,
and executing it is what creates the DOM.

## A popover has to be allowed to open empty

[Select](/components/select) and [ComboBox](/components/combo-box) keep their popover shut when
there are no options, which means the empty state inside it never gets the chance to say so.
`allows-empty-collection` is what lets the popover open on nothing — without it, a search that
matches no option looks like a control that has stopped responding.

## Accessibility

- Inside a list box the message is rendered as a disabled option rather than as loose text, so a
  reader arrowing through the list meets it where the options would have been instead of finding
  silence.
- It carries no live region. An empty state is content that replaced other content, not an event
  to announce — the collection it sits in is what a reader is already listening to.
- The text is the whole component, so it has to read as a sentence on its own. It is reached
  without the surrounding heading, which is what makes an icon or a bare "None" too little.

## API

<Api family="empty-state" />
