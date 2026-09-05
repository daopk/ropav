---
title: Link
description: An anchor with the library's press, hover and focus behaviour, and a way into your router.
outline: [2, 3]
---

# Link

A link goes somewhere. That is what separates it from a [Button](/components/button), which does
something — and it is worth holding to, because the browser gives a real anchor a middle-click, a
context menu and a copyable address that no button can offer.

```ts
import { Link, LinkIcon } from "ropav";
```

<Demo title="link-basic.vue">
<DemoLinkBasic />

<template #code>

<<< @/.vitepress/theme/demos/link-basic.vue

</template>
</Demo>

`LinkIcon` marks the link's icon, at either end of the label. Left empty it draws an
external-link glyph and makes room for it; fill its slot with your own and the extra room is
dropped, because a glyph of your own does not need it.

The underline is a class decision rather than a prop: by default it appears on hover and while
the link is pressed, `class="underline"` keeps it there, and `class="no-underline"` takes it away.

## When it is not an anchor

A link with no `href`, and a disabled link, render as a `<span role="link">` instead — there is
no destination for the browser to follow, and pretending otherwise leaves a stray click or a
middle-click going somewhere. The consequence is that a DOM `click` is not a reliable signal
here: a span never produces one from <kbd>Enter</kbd>. Listen for `press` instead, which every
activation path reaches.

## Routing

`RouterProvider` hands the link your application's `navigate`, and from then on a click is
intercepted rather than followed. It stands aside for every click the browser must keep — a
modifier held, another origin, a download, another target — so those keep working without being
listed anywhere.

<Demo title="link-router.vue">
<DemoLinkRouter />

<template #code>

<<< @/.vitepress/theme/demos/link-router.vue

</template>
</Demo>

`aria-current="auto"` is the opt-in: it asks the router whether this link addresses the route
showing now, and resolves to `"page"` when it does. Asking is per link, so a link that names its
own `aria-current`, or names none, is left alone. The matching rule is yours — `isCurrent` is
where you decide whether a section link counts as current on its child pages.

For a router mounted under a base path or running in hash mode, `resolveHref` rewrites the address
the anchor carries. The router itself is still handed the href as the link declared it, because
that is the path it wants back.

## Accessibility

- `aria-current="auto"` never reaches the DOM. It is resolved before rendering, so the attribute
  is either a real ARIA token or absent.
- `data-current` is rendered alongside it, which is what gives you a selector for the current
  link's styling without a class to keep in step.
- A tab index is written even on a real anchor, because Safari does not focus one without it. A
  disabled link gets none.
- A link that opens in a new tab should say so — the icon is not an accessible name, and
  `rel="noopener noreferrer"` belongs with `target="_blank"` either way.

## API

<Api family="link" />
