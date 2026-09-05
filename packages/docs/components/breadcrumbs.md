---
title: Breadcrumbs
description: The trail back up, with the current page at the end of it.
outline: [2, 3]
---

# Breadcrumbs

Breadcrumbs say where a page sits, and offer the way back up. They are for a hierarchy the site
already has — not for a sequence of steps, which is a different thing and reads better as
progress.

```ts
import { Breadcrumbs, BreadcrumbsItem } from "ropav";
```

<Demo title="breadcrumbs-basic.vue">
<DemoBreadcrumbsBasic />

<template #code>

<<< @/.vitepress/theme/demos/breadcrumbs-basic.vue

</template>
</Demo>

The last item is the current page, and the component works that out rather than asking. It marks
it `aria-current="page"`, disables it so it cannot navigate to where you already are, and leaves
off the separator after it. Give the last item no `href` and there is nothing left to say.

Each item is a [Link](/components/link) underneath, so `target`, `rel`, `download` and the rest of
a link's props are accepted on `BreadcrumbsItem` and behave the same way — including
`RouterProvider`, which a breadcrumb navigates through like any other link.

## A separator of your own

`separator` takes plain text, which is rendered as-is, or a component, which is rendered with the
separator's own class. The default is a chevron.

<Demo title="breadcrumbs-separator.vue">
<DemoBreadcrumbsSeparator />

<template #code>

<<< @/.vitepress/theme/demos/breadcrumbs-separator.vue

</template>
</Demo>

## Accessibility

- The list is an `<ol>` named "Breadcrumbs" in the reader's language. `aria-label` replaces that
  name where the page has more than one trail on it.
- Items are read in document order and the current one is worked out from it, so reordering the
  markup moves the current page with it.
- `is-disabled` on the root disables every link at once, for a trail that is on screen while the
  page it belongs to is still loading.

## API

<Api family="breadcrumbs" />
