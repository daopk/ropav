---
title: ColorSwatchPicker
description: A set of colours to choose from, rather than a whole colour space.
outline: [2, 3]
---

# ColorSwatchPicker

A swatch picker offers the colours somebody has already decided on — a brand palette, a set of
label colours. That is the whole difference from the rest of the colour components: a
[ColorArea](/components/color-area) or a [ColorSlider](/components/color-slider) lets the reader
reach any colour, and this one deliberately does not.

```ts
import {
  ColorSwatchPicker,
  ColorSwatchPickerIndicator,
  ColorSwatchPickerItem,
  ColorSwatchPickerSwatch,
} from "ropav";
```

Each `ColorSwatchPickerItem` carries a `color` and holds two parts: `ColorSwatchPickerSwatch`
paints it, and `ColorSwatchPickerIndicator` marks the selected one.

::: playground color-swatch-picker
:::

## A palette

`variant` is the shape of a swatch and `layout` is how they are arranged — `grid` wraps into rows,
`stack` runs down a column.

<Demo title="color-swatch-picker-presets.vue">
<DemoColorSwatchPickerPresets />

<template #code>

<<< @/.vitepress/theme/demos/color-swatch-picker-presets.vue

</template>
</Demo>

`layout` picks the modifier and nothing else: the keyboard stays two-dimensional either way, so
the arrow keys work the same in a column as in a grid.

Inside a [ColorPicker](/components/color-picker) the picker reads and writes the shared colour,
which is how a palette sits beside a slider and the two stay in step.

## Accessibility

- Each swatch is a `role="img"` announced by the colour's own name — "vibrant red", not
  `#f43f5e` — generated from the value, so a palette is usable without seeing it.
- `color-name` on a swatch replaces that generated name where your own is better. A brand name
  belongs there: "Ocean" says more than "medium blue" to somebody choosing from your palette.
- The picker names itself if nothing else does, so `aria-label` is what says which colour on the
  page is being chosen — the swatches only say what they are, not what they are for.

## API

<Api family="color-swatch-picker" />
