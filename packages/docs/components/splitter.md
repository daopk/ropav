---
title: Splitter
description: Resizable panels, with a divider you can drag, type at, or leave alone.
outline: [2, 3]
---

# Splitter

A splitter divides a space into panels the reader can resize. It fills whatever contains it, so
the container is what decides the overall size — a splitter with nothing around it has nothing to
divide.

```ts
import { Splitter, SplitterHandle, SplitterPanel } from "ropav";
```

::: playground splitter
:::

Panels and handles alternate, and there are as many handles as there are gaps. A `horizontal`
splitter puts its panels side by side, which makes each handle a vertical line.

## Sizing

`default-size` takes `fr`, `px` or `%`. A `px` panel holds its width when the container resizes
and the `fr` beside it absorbs the difference, which is the shape of most sidebars. `min-size` and
`max-size` clamp a drag and cannot be given in `fr` — a fraction has no fixed size to compare
against.

`is-collapsible` changes what happens at the minimum: instead of stopping there, dragging past it
snaps the panel shut. `collapsed-size` is what shut means — `0` takes the panel out of the layout,
`48` leaves an icon rail.

<Demo title="splitter-collapsible.vue">
<DemoSplitterCollapsible />

<template #code>

<<< @/.vitepress/theme/demos/splitter-collapsible.vue

</template>
</Demo>

`show-grip` draws the mark across the middle of the divider. It is decoration: the grab area
reaches well past the visible line either way, so turning it off makes the handle no harder to
hit.

## Remembering the layout

`auto-save-id` stores the sizes under `ropav:splitter:<id>` in `localStorage` and reads them back
once after mount. A stored layout is discarded unless it still matches the panels on screen, which
is why panels worth remembering should carry explicit `id`s — generated keys stop matching the
moment a panel is added, removed or reordered.

```vue
<Splitter aria-label="Workspace" auto-save-id="workspace">
  <SplitterPanel id="sidebar" default-size="240px" min-size="160px">…</SplitterPanel>
  <SplitterHandle id="sidebar-handle" />
  <SplitterPanel id="editor">…</SplitterPanel>
</Splitter>
```

## Controlled sizes

Pass `sizes` and a drag reports what it *would* do rather than doing it, leaving the layout to
whatever you write back. `default-sizes` is the uncontrolled equivalent, and a panel can take
`size` or `default-size` of its own instead.

## Accessibility

- Each handle is a `role="separator"` with the ARIA value attributes for the panel before it, so a
  reader hears a size rather than a divider.
- Its `aria-orientation` is the inverse of the layout: a horizontal splitter has vertical
  dividers, and the attribute describes the divider.
- Arrow keys along the axis move the handle by `keyboard-step`, and with <kbd>Shift</kbd> by
  `keyboard-large-step`. <kbd>Home</kbd> and <kbd>End</kbd> push it as far as it will go,
  <kbd>Enter</kbd> collapses or restores a collapsible neighbour, and <kbd>Esc</kbd> abandons a
  drag in progress.
- Double-clicking a handle puts both its neighbours back to their declared `default-size`, and
  reopens a collapsed one on the way. That is a different gesture from <kbd>Enter</kbd> on purpose:
  one returns a panel to where the reader left it, the other to where the author put it.
- Name the splitter with `aria-label`, and each handle with `aria-label` where "Resize panel" is
  not enough to tell two of them apart.

## API

<Api family="splitter" />
