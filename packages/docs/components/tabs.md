---
title: Tabs
description: One panel at a time, with the tab list as a single stop in the tab order.
outline: [2, 3]
---

# Tabs

Tabs show one panel at a time from a set that belongs together. A `TabsTab` and its `TabsPanel`
are paired by `id`, so the order they appear in the markup does not have to match.

```ts
import { Tabs, TabsList, TabsPanel, TabsTab } from "ropav";
```

::: playground tabs
:::

## A tab list and its panels

`TabsListContainer` is what scrolls when the tabs do not fit; `TabsList` is the row itself.
`TabsIndicator` goes inside each tab rather than beside the list, so the marker travels with the
tab it belongs to.

<Demo title="tabs-basic.vue">
<DemoTabsBasic />

<template #code>

<<< @/.vitepress/theme/demos/tabs-basic.vue

</template>
</Demo>

## Activation

`keyboard-activation` decides what the arrow keys do. The default follows focus — moving to a tab
selects it — which is right when switching is instant. Set it to `manual` when a panel costs
something to show, so the reader arrows to the tab they want and presses <kbd>Enter</kbd>.

## Accessibility

- The tab list is one stop in the tab order. Arrow keys move between the tabs inside it, and
  <kbd>Home</kbd> and <kbd>End</kbd> jump to the ends.
- `aria-label` on `TabsList` names the set. Give it one whenever the surrounding heading does not
  already say what the tabs are for.
- Each panel is labelled by its tab, so a reader who moves into the panel hears which one they
  are in.

## API

<Api family="tabs" />
