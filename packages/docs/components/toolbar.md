---
title: Toolbar
description: A row of controls that a keyboard leaves in one press.
outline: [2, 3]
---

# Toolbar

A toolbar collects related controls and gives them a shared keyboard. Its point is not the row —
a flex container does that — but what <kbd>Tab</kbd> does with it: a toolbar of nine buttons is
one thing to move past, not nine.

```ts
import { Toolbar } from "ropav";
```

::: playground toolbar
:::

## Groups and rules

Whatever sits inside takes its axis from the toolbar, so nothing has to be told twice. A
`Separator` inside a horizontal toolbar draws a *vertical* rule — a row of controls is broken up
across the row — and a `ButtonGroup` or `ToggleButtonGroup` lays itself out along the toolbar's
own direction.

<Demo title="toolbar-groups.vue">
<DemoToolbarGroups />

<template #code>

<<< @/.vitepress/theme/demos/toolbar-groups.vue

</template>
</Demo>

`is-attached` lifts the controls onto a raised, rounded surface instead of leaving them bare —
for a toolbar that floats over content rather than sitting in the page.

## Accessibility

- Every control stays tabbable, and the arrow keys move between them. They clamp at the ends
  rather than wrapping: the end of a toolbar is a boundary, not a loop.
- <kbd>Tab</kbd> moves focus to the far end of the toolbar and then lets the browser carry on, so
  a keyboard user leaves the whole toolbar in one press.
- The control focus last sat on is restored when focus comes back from outside, so returning to a
  toolbar does not put you back at its first button.
- A toolbar inside a toolbar reports `role="group"` and hands its keys upward. Only the outermost
  one owns the keyboard, which is what stops an arrow key being consumed twice.
- Give the toolbar an `aria-label`, and an icon-only control inside it one of its own.

## API

<Api family="toolbar" />
