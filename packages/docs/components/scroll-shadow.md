---
title: ScrollShadow
description: A scrolling box that fades the edge it has content past.
outline: [2, 3]
---

# ScrollShadow

A scroll shadow is a scrolling box that says so. It fades whichever edge has content beyond it —
and only that edge, so the top stays sharp until something has actually been scrolled away.

It *is* the scroller: it owns the overflow, so give it a height to scroll within and put the
padding on it rather than on a wrapper.

```ts
import { ScrollShadow } from "ropav";
```

::: playground scroll-shadow
:::

Scroll the box to watch the fades come and go. `size` is the depth of the fade in pixels, and
`offset` is how far the content has to have moved before one appears at all.

## Horizontally

`orientation` decides the axis and, with it, which two edges can fade.

<Demo title="scroll-shadow-horizontal.vue">
<DemoScrollShadowHorizontal />

<template #code>

<<< @/.vitepress/theme/demos/scroll-shadow-horizontal.vue

</template>
</Demo>

## Saying which edges yourself

`visibility` is `auto` by default, which is the component watching its own overflow. Naming an
edge — `top`, `both`, `none` — takes that over, for a box whose content is about to change and
should not flicker while it does. `on-visibility-change` reports what automatic detection settled
on, and `is-enabled` stops that detection running at all.

## The fade is a mask

The edges are cut out of the box rather than painted over it, so the effect works over any
background the box happens to sit on — a card, a surface, a photograph — without being told what
is behind it.

That also means it applies to everything inside, which is worth knowing before putting an
interactive control right at a fading edge.

## API

<Api family="scroll-shadow" />
