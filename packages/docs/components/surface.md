---
title: Surface
description: A background fill and the foreground colour that belongs on it.
outline: [2, 3]
---

# Surface

A surface is a background and nothing else — no padding, no radius, no border. It paints one of
the theme's surface fills together with the foreground colour meant to be read on it, and tells
its descendants which surface they are sitting on.

It is the layer under [Card](/components/card): a card is a surface with a shape. Reach for
`Surface` directly when you want the colour relationship without the shape, and give it the rest
with classes.

```ts
import { Surface } from "ropav";
```

::: playground surface
:::

## Stepping back

`default`, `secondary` and `tertiary` step back one surface at a time, and which one to use
depends on what is behind it: a surface on the page body wants `default`, a surface inside another
wants the next one along.

<Demo title="surface-nesting.vue">
<DemoSurfaceNesting />

<template #code>

<<< @/.vitepress/theme/demos/surface-nesting.vue

</template>
</Demo>

`transparent` is the fourth and is different in kind: it paints no fill at all, so it shows
whatever is behind it. Use it when the element is only there for the spacing or the layout.

## Accessibility

- Under Forced Colors Mode a painted surface is given an outline. The mode flattens fills onto the
  page and strips shadows, so without one the surface stops having any shape and its contents sit
  loose on the page. It is an outline rather than a border so nothing shifts.
- Anything sitting on a surface that may be see-through has to be built from tokens that hold
  their contrast against an unknown fill — see [Translucent surfaces](/theming/tokens#translucent-surfaces).

## API

<Api family="surface" />
