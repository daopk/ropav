---
title: ColorArea
description: Two colour channels on two axes, with one thumb between them.
outline: [2, 3]
---

# ColorArea

A colour area is the square in a colour picker: two channels laid out on two axes with one thumb
moving across both. The third channel is not here — it belongs to a slider beside it, which is why
an area is almost always part of a [ColorPicker](/components/color-picker) rather than a control
on its own.

```ts
import { ColorArea, ColorAreaThumb } from "ropav";
```

::: playground color-area
:::

Pressing anywhere on the square jumps the thumb there and carries straight on as a drag, so
picking a colour is one gesture rather than a press followed by a grab.

## Choosing the channels

`x-channel` and `y-channel` have to belong to the area's colour space, and the space defaults to
whichever one the value is already in. So the value decides the square: `hsb(30, 100%, 100%)`
gives you saturation × brightness, and an `rgb` value gives you red × green.

<Demo title="color-area-channels.vue">
<DemoColorAreaChannels />

<template #code>

<<< @/.vitepress/theme/demos/color-area-channels.vue

</template>
</Demo>

An area with no value at all falls back to white, which is an `rgb` colour — so it is red × green,
not the hue square the name might suggest. Give it a `default-value` in the space you mean.

## Accessibility

- Under the square are two hidden range inputs, one per channel. They juggle `tabindex` and
  `aria-hidden` so assistive technology lists *one* two-dimensional control rather than two
  sliders — and then reveal both as soon as the keyboard is used, so each channel can be read on
  its own.
- `aria-valuetext` follows from that. Before the keyboard is used a reader hears all three
  channels; after it, only the one that moved. Both go back to the start when focus leaves.
- The arrow keys move one step along their axis. <kbd>Home</kbd> and <kbd>End</kbd> page along x
  and <kbd>PageUp</kbd> / <kbd>PageDown</kbd> page along y — which is *not* what those keys mean
  on a slider, where they jump to the ends.
- `aria-label` names the area, and the words "color picker" are appended to whatever you give it.

## API

<Api family="color-area" />
