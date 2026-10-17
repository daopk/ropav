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

## Sizing

The geometry is a set of custom properties on the root. Each one is named for its axis, so the same
values serve a vertical slider.

| Property | Default | What it sets |
| --- | --- | --- |
| `--slider-track-thickness` | `calc(var(--rp-spacing) * 5)` | The track's room in the layout, and the band a press lands on |
| `--slider-rail-thickness` | the track's | The bar painted down the middle of the track, never thicker than it |
| `--slider-thumb-length` | `1.5rem` | The knob along the track |
| `--slider-thumb-thickness` | `1rem` | The knob across it |
| `--slider-thumb-radius` | `min(32px, var(--rp-component-radius))` | The knob's corners |
| `--slider-thumb-inset` | half the thumb's length | How far short of either end the thumb's centre stops |

A bar thinner than the track stays easy to hit: the band around it takes a press as the bar
would. The default inset keeps the knob on the bar at both ends; `0px` lets it hang half past
them, centred on the end of the bar.

<Demo title="slider-slim.vue">
<DemoSliderSlim />

<template #code>

<<< @/.vitepress/theme/demos/slider-slim.vue

</template>
</Demo>

The thumb element frames the knob in the fill colour. The knob you see is the thumb's `::after`,
so a colour of your own goes there, in plain CSS, which outranks the library's layer. Its shadow is
`--rp-shadow`, the slot its `box-shadow` is built from. The keyboard focus ring belongs to the
thumb element, which is never smaller than the knob, so the ring stays outside it whatever the
sizes.

```css
.volume [data-slot="slider-thumb"]::after {
  background-color: var(--rp-surface);
  --rp-shadow: 0 1px 3px oklch(0 0 0 / 0.3);
}
```

### Drawing on the track

`SliderTrack` is the bar, so whatever you put in it with `position: absolute` and
`inset-block: 0` lines up with the fill. A range of your own, such as how much of a recording
has loaded, goes before `SliderFill` so the fill paints over it, with `aria-hidden` because it
says nothing about the value.

```vue-html
<SliderTrack>
  <span class="loaded" :style="{ width: `${loaded * 100}%` }" aria-hidden="true" />
  <SliderFill />
  <SliderThumb />
</SliderTrack>
```

```css
.loaded {
  position: absolute;
  inset-block: 0;
  left: 0;
  border-radius: inherit;
  background-color: color-mix(in oklab, var(--rp-foreground) 20%, transparent);
  pointer-events: none;
}
```

### Previewing a press

While a mouse or pen hovers over the track, its slot hands over `hoverValue`, the value a press
there would set, snapped to the step, and `hoverPercent`, where that value sits along the track
from 0 to 1. Placed in the track at that fraction, a preview sits where the thumb would land. Both
are `null` while nothing hovers, under touch, and while the slider is disabled.

<Demo title="slider-hover.vue">
<DemoSliderHover />

<template #code>

<<< @/.vitepress/theme/demos/slider-hover.vue

</template>
</Demo>

The preview repeats what the thumb announces once it is pressed, so it is `aria-hidden`.

## Accessibility

- Each thumb is a native range input, so the value and the range are the browser's to announce.
- Arrow keys move by `step`, <kbd>Home</kbd> and <kbd>End</kbd> jump to the ends.
- Give the slider a `Label`, or an `aria-label` when there is no room for one. A two-thumb slider
  labels each end from the group, so a reader hears which end they are moving.

## API

<Api family="slider" />
