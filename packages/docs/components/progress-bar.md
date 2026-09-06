---
title: ProgressBar
description: How far along a task is, on a horizontal track.
outline: [2, 3]
---

# ProgressBar

A progress bar is a task moving towards its end — a file uploading, an import working through its
rows. Where the quantity is settled rather than moving, that is a [Meter](/components/meter); and
where nothing can be said about how far along a wait is, a [Spinner](/components/spinner) says
less and says it more honestly.

```ts
import { Label, ProgressBar, ProgressBarFill, ProgressBarOutput, ProgressBarTrack } from "ropav";
```

`ProgressBarTrack` is the groove and `ProgressBarFill` is what travels along it.
`ProgressBarOutput` prints the value as text, and a `Label` names the task the bar belongs to —
without one, the bar needs an `aria-label` instead.

::: playground progress-bar
:::

## When the end is not known

`is-indeterminate` drops the value and animates the fill in its place, for a wait that has begun
but cannot yet be measured. The bar keeps its role and simply stops reporting a number, which is
the difference a screen reader is told about.

<Demo title="progress-bar-indeterminate.vue">
<DemoProgressBarIndeterminate />

<template #code>

<<< @/.vitepress/theme/demos/progress-bar-indeterminate.vue

</template>
</Demo>

## Stripes

`is-striped` lays a diagonal band over the fill and `is-animated` sets it travelling. Animating
turns the band on by itself, so `is-striped` is only needed for a still one. Under reduced motion
the travelling band settles into that still band rather than vanishing, so the bar does not change
shape when the setting does.

<Demo title="progress-bar-striped.vue">
<DemoProgressBarStriped />

<template #code>

<<< @/.vitepress/theme/demos/progress-bar-striped.vue

</template>
</Demo>

## Accessibility

- The bar is a `role="progressbar"` carrying `aria-valuenow`, `aria-valuemin` and `aria-valuemax`,
  so its value is announced as a proportion rather than as a bare number.
- `format-options` decides how that value reads — a percentage by default, but bytes or a plain
  count where those are what the reader is actually waiting on. `value-label` replaces the text
  outright.
- An indeterminate bar drops `aria-valuenow` rather than reporting zero, which is what stops it
  being read as no progress at all.
- Name the task, not the widget. A label reading "Uploading" tells the reader what is happening;
  one reading "Progress" tells them what they can already see.

## API

<Api family="progress-bar" />
