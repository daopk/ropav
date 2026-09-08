---
title: AvatarGroup
description: A set of avatars in the space of not many more than one.
outline: [2, 3]
---

# AvatarGroup

A group lays out a set of [avatars](/components/avatar) so they overlap, and hands each of them its
size. Two things about it are not the layout they look like: which avatar wins an overlap is paint
order rather than position, so reversing it takes a stacking rule and not a margin; and the gap
between two of them is not a gap at all but a ring in the colour of whatever is behind the group,
which is the one thing the group cannot know for itself.

```ts
import { Avatar, AvatarGroup, AvatarGroupOverflow } from "ropav";
```

::: playground avatar-group
:::

## Which avatar is in front

`front` chooses that, and it never reorders anyone: both directions read left to right in the order
they were written, and only the overlap changes hands.

<Demo title="avatar-group-front.vue">
<DemoAvatarGroupFront />

<template #code>

<<< @/.vitepress/theme/demos/avatar-group-front.vue

</template>
</Demo>

`"last"` is free, being the order the document paints in already. `"first"` reverses it as far as
ten avatars, past which the tail falls back — a group that long wants `AvatarGroupOverflow` rather
than an eleventh face.

## The ring

`--avatar-group-ring-color` is the surface showing through between two avatars. It defaults to the
page, so a group on anything else has to be told what it is sitting on.

<Demo title="avatar-group-surface.vue">
<DemoAvatarGroupSurface />

<template #code>

<<< @/.vitepress/theme/demos/avatar-group-surface.vue

</template>
</Demo>

## Overlap and spacing

`overlap` is a share of one avatar rather than a distance, so the tuck reads the same at every
size. `overlap="none"` spaces the avatars out instead and drops the ring with it, there being
nothing left for it to cut through.

## Accessibility

- The group takes no role of its own. It is a layout container, and an avatar beside the name it
  belongs to is decorative — so a boundary announced around one says nothing. Pass `role="group"`
  and a name where the set really is the only thing on the page saying who is in it.
- A link or button wrapping an avatar has nothing to be called: `alt` is empty by default, and a
  loaded image covers the initials the fallback would have carried. Name the link, not the image.
- `AvatarGroupOverflow` reads as `+5`. Write its slot where the number needs words around it.
- With forced colours on, the ring goes — box shadows do. Each avatar's own edge separates it from
  the next one instead, so the stack stays legible.

## API

<Api family="avatar-group" />
