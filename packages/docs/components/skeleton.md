---
title: Skeleton
description: A placeholder in the shape of what is coming.
outline: [2, 3]
---

# Skeleton

A skeleton stands in for content that has not arrived, in roughly the shape it will arrive in. It
supplies the fill and the animation and nothing else — the shape is yours, given with classes, so
one component covers an avatar, a headline and a thumbnail.

```ts
import { Skeleton } from "ropav";
```

::: playground skeleton
:::

## In the shape of the thing

<Demo title="skeleton-card.vue">
<DemoSkeletonCard />

<template #code>

<<< @/.vitepress/theme/demos/skeleton-card.vue

</template>
</Demo>

A skeleton that does not resemble what replaces it is worse than none: the layout shifts when the
content lands, and the reader has been shown a shape that turned out to be a lie.

## The animation is a theme decision

`animation-type` is an override. Left unset, the skeleton reads `--skeleton-animation` from the
theme, so a theme can settle on `pulse` or turn the animation off across a whole application
without a prop being passed anywhere.

For one shimmer travelling across a group rather than one per placeholder, put the shimmer class
on the container. A container carrying it that has skeletons inside runs a single pass over all of
them and stops each child's own:

```vue
<div class="rp-skeleton--shimmer relative grid grid-cols-3 gap-4 overflow-hidden rounded-xl">
  <Skeleton class="h-24 rounded-xl" />
  <Skeleton class="h-24 rounded-xl" />
  <Skeleton class="h-24 rounded-xl" />
</div>
```

## Accessibility

- A skeleton says nothing to a screen reader, which is the right answer for a decoration standing
  in for content. Announce the wait itself where it matters — a `role="status"` on the region, or
  a [Spinner](/components/spinner), says a load is in progress in a way a shape cannot.
- Under Forced Colors Mode the fill flattens to the page colour and the shimmer is dropped
  outright, so the placeholder is given an inset outline instead — otherwise it would vanish.
- Neither animation is turned off for a reader who has asked for reduced motion. Setting
  `--skeleton-animation: none` in the theme is how to answer that across an application.

## API

<Api family="skeleton" />
