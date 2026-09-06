---
title: Chip
description: A small standalone label, for a status or a category.
outline: [2, 3]
---

# Chip

A chip is a small label that stands on its own — a build status, a plan name, a category. It is
display only, so if the reader is meant to select it or remove it you want a
[TagGroup](/components/tag-group); if it belongs to something else rather than to the flow of the
page, you want a [Badge](/components/badge).

```ts
import { Chip, ChipLabel } from "ropav";
```

::: playground chip
:::

## With something beside the label

`ChipLabel` carries the text. Text on its own is wrapped for you when the caller is compiled in
[Vapor mode](/guide/vapor); with an icon or a dot beside it the label has to be written out, so
the examples here always write it.

<Demo title="chip-icon.vue">
<DemoChipIcon />

<template #code>

<<< @/.vitepress/theme/demos/chip-icon.vue

</template>
</Demo>

`bg-current` on the dot takes the chip's own text colour, so one class covers all five colours.

## Accessibility

- A chip carries no role: it is read as the text it contains, wherever it sits.
- Colour is the whole of the difference between a passing build and a failing one, so the label
  has to say which — a red chip reading "Build" tells a reader who cannot see the red nothing at
  all.
- A decorative mark beside the label needs `aria-hidden`, or it is announced as an unlabelled
  image in the middle of the text.

## API

<Api family="chip" />
