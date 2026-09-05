---
title: Avatar
description: A portrait with something to show while it is not there.
outline: [2, 3]
---

# Avatar

An avatar shows a person or a thing at a small fixed size. Most of the component is about the
image *not* being there: it is probed before it is rendered, and the fallback holds the space
until the image is known to be usable — so the layout never jumps and a broken source never leaves
a torn icon behind.

```ts
import { Avatar, AvatarFallback, AvatarImage } from "ropav";
```

::: playground avatar
:::

## Image and fallback

<Demo title="avatar-image.vue">
<DemoAvatarImage />

<template #code>

<<< @/.vitepress/theme/demos/avatar-image.vue

</template>
</Demo>

`delay-ms` holds the fallback back for that long before it may render, so an image that arrives
quickly never flashes initials on the way. It only ever reveals the fallback — nothing puts it
back — so a cached image that resolves immediately shows no fallback at all, delay or not.

`loading-status-change` reports `loading`, `loaded` or `error` for a caller that wants to do
something else with the failure.

## Accessibility

- `alt` defaults to empty, which marks the image decorative. An avatar almost always sits beside
  the name it belongs to, and the fallback carries the initials, so a description here usually
  repeats what is already on the page. Set it where the avatar is genuinely the only thing naming
  the person. Leaving the attribute off altogether is never right, and the component never does.
- The fallback's colour is a decoration, not a signal: two people with the same initials are told
  apart by the name beside the avatar, not by the shade behind it.
- `variant="soft"` and `color` change the fallback's appearance only. An image covers them.

## API

<Api family="avatar" />
