---
title: Badge
description: A count or a dot pinned to the corner of something else.
outline: [2, 3]
---

# Badge

A badge attaches to something: a count on an avatar, a status dot on an icon button. That is what
separates it from a [Chip](/components/chip), which stands on its own in the flow of the page.

```ts
import { Badge, BadgeAnchor, BadgeLabel } from "ropav";
```

`BadgeAnchor` wraps the thing being badged *and* the badge, and it is what `placement` positions
against. Without it the badge has no corner to sit in.

::: playground badge
:::

## A dot

A badge with nothing in it is a dot — the same four placements and five colours, with no number
to read.

<Demo title="badge-dot.vue">
<DemoBadgeDot />

<template #code>

<<< @/.vitepress/theme/demos/badge-dot.vue

</template>
</Demo>

## Content

`BadgeLabel` carries the badge's text. Text on its own is wrapped for you when the caller is
compiled in [Vapor mode](/guide/vapor); writing the label out works either way, which is what the
examples here do. Anything that is not plain text — an icon — is left alone and needs the label
written out beside it in any case.

## Accessibility

- A badge carries no role and no live region. Its text is read in the flow where it sits, and a
  dot badge says nothing at all.
- So put the state in text wherever it matters. "Ada — Online" beside the avatar is read; a green
  dot on its own is not, and neither is a bare `5` without something nearby saying five of what.

## API

<Api family="badge" />
