---
title: Separator
description: A rule between things that belong to different groups.
outline: [2, 3]
---

# Separator

A separator draws the line between two groups of content. It is a real `role="separator"` rather
than a border, which is the point: a border says the box has an edge, a separator says these
things are not the same things.

```ts
import { Separator } from "ropav";
```

::: playground separator
:::

`orientation` decides the axis, but inside a [Toolbar](/components/toolbar) it does not need
setting — a separator falls back to the toolbar's *cross* axis, because a rule between controls in
a row has to run down the page. Set it explicitly anywhere else.

## Between things in a row

The same component does both jobs: full width between stacked blocks, and a hairline between items
on one line. A vertical separator sizes itself from its flex parent, so it needs a row with a
height to stretch into.

<Demo title="separator-inline.vue">
<DemoSeparatorInline />

<template #code>

<<< @/.vitepress/theme/demos/separator-inline.vue

</template>
</Demo>

`variant` is the weight — `default`, `secondary` and `tertiary` in descending contrast. Under
forced colours all three flatten to the same ink, because the mode has no second tier to give
them; a separator that has to be distinguishable from another separator is asking colour to carry
structure.

## Accessibility

- The rule is a real `role="separator"`, so a reader moving through the document is told where one
  group ends rather than silently crossing into the next.
- A separator inside a [ButtonGroup](/components/button-group) or a
  [ToggleButtonGroup](/components/toggle-button-group) is a different component and a decorative
  one — `ButtonGroupSeparator` is `aria-hidden`, because the group is already one control and a
  rule inside it divides nothing.
- Do not reach for one where whitespace would do. A separator every few rows is structure; a
  separator between every row is noise a screen reader has to read through.

## API

<Api family="separator" />
