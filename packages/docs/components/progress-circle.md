---
title: ProgressCircle
description: The same reading as a progress bar, drawn as a ring.
outline: [2, 3]
---

# ProgressCircle

A progress circle says exactly what a [ProgressBar](/components/progress-bar) says, in a frame
that has no width to spend: a tile, a table cell, a button. Reach for the bar wherever there is a
row to fill, because a bar carries a label and a printed value alongside it and a ring has room
for neither.

```ts
import {
  ProgressCircle,
  ProgressCircleFillCircle,
  ProgressCircleTrack,
  ProgressCircleTrackCircle,
} from "ropav";
```

The track is an `<svg>`: `ProgressCircleTrackCircle` draws the unfilled ring and
`ProgressCircleFillCircle` draws the arc over it. Both are needed, and in that order — the fill is
painted second because it sits on top.

::: playground progress-circle
:::

## When the end is not known

`is-indeterminate` spins the arc instead of sizing it, the same way the bar animates its fill.
There is no label beside a circle to carry the wait, so name it with `aria-label` in both states.

<Demo title="progress-circle-indeterminate.vue">
<DemoProgressCircleIndeterminate />

<template #code>

<<< @/.vitepress/theme/demos/progress-circle-indeterminate.vue

</template>
</Demo>

An indeterminate circle and a [Spinner](/components/spinner) look alike and are not the same
thing: the spinner is the right one where progress will never be measurable, the circle where the
number is simply not known yet and will be.

## Accessibility

- The circle is a `role="progressbar"` with the same value attributes as the bar, so what a screen
  reader hears does not depend on which of the two you drew.
- The ring is an unnamed `<svg>` with no text in it, so `aria-label` is the only name the circle
  has and it is not optional. A bar can lean on the `Label` beside it; this cannot.
- Where the ring sits beside text that already names the wait, point at that text with
  `aria-labelledby` rather than repeating it.

## API

<Api family="progress-circle" />
