---
title: ColorPicker
description: One colour, shared with every colour control under it.
outline: [2, 3]
---

# ColorPicker

A colour picker holds one colour and opens a popover to change it. What it mostly does is share:
every colour component underneath reads the picker's value and writes back to it, so a swatch, an
area, a slider and a field inside one picker are all looking at the same colour without a single
`v-model` between them.

```ts
import { ColorPicker, ColorPickerPopover, ColorPickerTrigger } from "ropav";
```

<Demo title="color-picker-basic.vue">
<DemoColorPickerBasic />

<template #code>

<<< @/.vitepress/theme/demos/color-picker-basic.vue

</template>
</Demo>

The trigger is a button showing a [ColorSwatch](/components/color-swatch) with no `color` of its
own — it takes the picker's. Inside the popover, [ColorArea](/components/color-area) covers two
channels and a `ColorSlider` covers the third; `ColorSwatchPicker` for presets and `ColorField`
for a typed hex value are the other two pieces, and both are in
[Storybook](/guide/storybook) along with the rest.

## Holding the colour

`default-value` starts an uncontrolled picker; `value` with a `change` listener, or
`v-model:value`, hands the colour to the caller. `change` carries a parsed `Color`, so
`color.toString("hex")` is how you get back to a string.

The popover's open state works the same way: `default-open`, or `is-open` with `open-change`.

## Accessibility

- The popover is a dialog, so <kbd>Esc</kbd> closes it and focus returns to the trigger.
- Every control inside names itself. The area and the sliders describe the channel they move and
  the colour they arrive at, which is what makes a colour reachable without seeing it — and it is
  why the popover should hold real colour controls rather than a canvas you drew yourself.
- The trigger needs to say what colour is being picked. The swatch announces the colour; the label
  beside it is what says which colour on the page it belongs to.

## API

<Api family="color-picker" />
