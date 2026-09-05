---
title: Sidebar
description: An application shell that collapses, remembers its width, and gets out of the way.
outline: [2, 3]
---

# Sidebar

`Sidebar` is the shell around a whole application, not a panel inside a page. It owns the split
between the navigation and the content, the collapsed state, the width, and the behaviour change
at the mobile breakpoint.

```ts
import { Sidebar, SidebarContent, SidebarInset, SidebarPanel } from "ropav";
```

## The shell

`SidebarPanel` is the navigation, `SidebarInset` is everything else. Both are children of
`Sidebar`, which is what lets the layout change without either of them knowing.

<Demo title="sidebar-basic.vue">
<DemoSidebarBasic />

<template #code>

<<< @/.vitepress/theme/demos/sidebar-basic.vue

</template>
</Demo>

## Collapsing

`collapsible` decides what collapsed means: `icon` keeps a rail of icons, `offcanvas` slides the
panel away entirely. `SidebarTrigger` toggles it, and `SidebarItemTooltip` is what gives an item
its name back once the label is hidden.

Below `breakpoint` the panel becomes a drawer over the content instead, with its own open state —
which is why `is-mobile-open` is separate from `is-expanded`.

## Remembering the layout

`auto-save-id` stores the expanded state and the width, and puts them back on the next visit.
They are applied rather than animated into place, so the reader does not watch the layout arrive.

`SidebarRail` makes the edge draggable, between `min-width` and `max-width`, with arrow keys
moving by `keyboard-step`.

## Accessibility

- `SidebarPanel` takes an `aria-label` — it is a landmark, and a page with more than one
  navigation region needs them told apart.
- The rail is a separator with a value, so a keyboard reader can resize it and hear the result.
- An item marks itself current through `aria-current`, which is what a router integration sets.

## API

<Api family="sidebar" />
