---
title: ColorSwatch
description: One colour, shown and named.
outline: [2, 3]
---

# ColorSwatch

A colour swatch shows a colour and says what it is. It is not a control — there is nothing to
press and nothing to change — which is what makes it usable anywhere a colour needs to appear: as
a picker's trigger, a legend, a preview beside a hex value.

```ts
import { ColorSwatch } from "ropav";
```

::: playground color-swatch
:::

`color` takes a `Color` or a string to parse — hex, `rgb()`, `hsl()`, `hsb()`. Inside a
[ColorPicker](/components/color-picker) it can be left off entirely, and the swatch shows whatever
colour the picker is holding.

## Transparency

A checkerboard is painted behind every swatch, so alpha reads as alpha rather than as a lighter
shade of the same hue.

<Demo title="color-swatch-transparency.vue">
<DemoColorSwatchTransparency />

<template #code>

<<< @/.vitepress/theme/demos/color-swatch-transparency.vue

</template>
</Demo>

No colour at all means a fully transparent swatch rather than an error — the checkerboard on its
own, announced as "transparent" rather than by a hue that would mean nothing.

## Accessibility

- The swatch is a `role="img"` with a role description of "color swatch", named after the colour
  it is showing — "vibrant cyan blue", in the reader's language.
- `color-name` replaces that generated name for a colour that has one of its own: a Pantone
  number, a brand colour, a name from your own palette.
- `aria-label` is *appended* to the colour name rather than replacing it, so a swatch labelled
  "Brand" still announces which colour brand is.
- Forced Colors Mode is turned off for the swatch alone. Everywhere else the mode repainting a
  fill is the point; here it would repaint the one thing the component exists to show.

## API

<Api family="color-swatch" />
