---
title: Slider
description: A value picked from a range, with one thumb or two.
outline: [2, 3]
---

# Slider

A slider is for a value whose exact number matters less than where it sits in a range. When the
number is what the reader is after, use [NumberField](/components/number-field) instead — or
both, as a pair.

```ts
import { Slider, SliderFill, SliderThumb, SliderTrack } from "ropav";
```

::: playground slider
:::

## One thumb or two

Pass a number for one thumb and an array for two. Each `SliderThumb` then takes the `index` it
controls, and the fill spans between them.

<Demo title="slider-basic.vue">
<DemoSliderBasic />

<template #code>

<<< @/.vitepress/theme/demos/slider-basic.vue

</template>
</Demo>

`SliderOutput` renders the current value, formatted through `format-options` the same way a
number field is. `SliderMarks` draws the ticks.

## Accessibility

- Each thumb is a native range input, so the value and the range are the browser's to announce.
- Arrow keys move by `step`, <kbd>Home</kbd> and <kbd>End</kbd> jump to the ends.
- Give the slider a `Label`, or an `aria-label` when there is no room for one. A two-thumb slider
  labels each end from the group, so a reader hears which end they are moving.

## API

<Api family="slider" />
