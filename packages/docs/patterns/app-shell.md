---
title: App shell
description: A collapsing sidebar, a header that says where you are, and the account menu.
outline: [2, 3]
---

# App shell

The frame every other screen sits inside. [Sidebar](/components/sidebar) supplies both halves of
it — `SidebarPanel` is the navigation and `SidebarInset` is everything else — so the two collapse
together without the page arranging them. The header above the content carries the trigger, the
[Breadcrumbs](/components/breadcrumbs) and the account menu. What goes inside `SidebarInset` is
the rest of this section — see [composing patterns](/patterns/#composing-patterns).

```ts
import { Breadcrumbs, Dropdown, Sidebar, SidebarInset, SidebarPanel, SidebarTrigger } from "ropav";
```

<Demo full open title="app-shell.vue">
<PatternAppShell />

<template #code>

<<< @/.vitepress/theme/patterns/app-shell.vue

</template>
</Demo>

## Collapsed to icons

`collapsible="icon"` narrows the panel to its icons rather than hiding it, and `SidebarRail` is the
edge you drag to do that. A narrowed item still has its label for a screen reader, but a pointer
user has nothing to read — which is what `SidebarItemTooltip` fills in, and only while narrowed.

## Below the breakpoint it is a drawer

Narrower than `breakpoint` the panel stops being a column beside the content and becomes a drawer
over it, backdrop and swipe-to-close included. `SidebarTrigger` opens that rather than toggling a
width, and its open state is `is-mobile-open` — separate from `is-expanded`, so a resize does not
overwrite what the other one held. The switch waits for mount, because a server has no `matchMedia`
to ask.

## A nav item is a button unless you give it an href

`SidebarItem` renders a button and emits `press`; pass `href` and it renders a link instead. Either
way `aria-current="page"` is what marks the one you are on, and `RouterProvider` can work that out
for you from `aria-current="auto"`.

## The account menu is on a button

`Dropdown` makes its first child the trigger, and that child has to be something that accepts a
press — a [Button](/components/button), or one of the `*Trigger` parts. `SidebarItem` presses, but
it does not take the trigger handed down, so an account row built from one opens nothing.

## Accessibility

- `SidebarPanel` takes an `aria-label`: it is a navigation landmark, and an unnamed one is just
  "navigation" in the landmark list.
- The last breadcrumb is the current page and carries no `href`, so it is not a link to where you
  already are.
- The account button is icon-only, so it names itself with `aria-label`.
