---
title: ColorSlider
description: One channel of a colour, on a track painted with the values it can take.
outline: [2, 3]
---

# ColorSlider

A colour slider moves a single channel — hue, saturation, alpha — and paints its own track with
the colours that channel would produce, so the track *is* the preview. Two channels at once want a
[ColorArea](/components/color-area); a set of fixed choices wants a
[ColorSwatchPicker](/components/color-swatch-picker).

```ts
import { ColorSlider, ColorSliderOutput, ColorSliderThumb, ColorSliderTrack, Label } from "ropav";
```

`ColorSliderTrack` is the painted bar and `ColorSliderThumb` is the handle on it.
`ColorSliderOutput` prints the current value, and a `Label` names the channel.

::: playground color-slider
:::

## Several channels, one colour

`channel` is required — a slider with no channel has nothing to move. Point several sliders at the
same value and each one edits its own channel of it, which is how a picker is built out of parts
rather than out of one widget.

<Demo title="color-slider-channels.vue">
<DemoColorSliderChannels />

<template #code>

<<< @/.vitepress/theme/demos/color-slider-channels.vue

</template>
</Demo>

`color-space` says which space the channel belongs to. A combination that cannot work — `red` in
`hsl` — is corrected with a warning rather than left painting nothing, so a mismatch shows up in
the console instead of as an empty bar. Left out, the space is taken from the value itself.

Inside a [ColorPicker](/components/color-picker) the value comes from the picker and no `v-model`
is needed at all.

## Accessibility

- The thumb is a real range input, so the arrow keys move the channel by a step and
  <kbd>Home</kbd> and <kbd>End</kbd> jump to the ends of it.
- A slider names itself after its channel when nothing else names it, so "Hue" is announced
  without a `Label` — but a page with two hue sliders on it needs `aria-label` to say which is
  which.
- The value is announced in the channel's own terms, a degree or a percentage, rather than as a
  raw number. That is what makes a colour adjustable without seeing the track.

## API

<Api family="color-slider" />
