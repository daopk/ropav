---
title: Installation
description: The package, the stylesheet, and how to import less of it.
---

# Installation

Ropav needs Vue 3.6 or newer — Vapor Mode is what it is built on. The stylesheet needs nothing:
it is plain CSS, whichever of the two ways below you take it.

::: code-group

```bash [pnpm]
pnpm add ropav
```

```bash [npm]
npm install ropav
```

```bash [yarn]
yarn add ropav
```

:::

`@ropav/styles` comes along as a dependency; you do not install it yourself.

## The stylesheet

Two ways in. They render the same components; what differs is whether anything resolves the
imports for you.

### Compiled, no build step

One finished file — every import followed, every rule resolved. Take it from your CSS:

```css
@import "ropav/styles/bundled.css";
```

from your entry module:

```ts
import "ropav/styles/bundled.css";
```

or from the page, with no bundler in the picture at all:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ropav/dist/ropav.min.css" />
```

It carries, in layer order (`theme, base, components, utilities`): the reset, the base styles and
the scrollbar system, one rule set per component, the default theme's tokens for light and dark,
and the classes the components name.

The bundled themes are finished CSS too, so a second `<link>` is all another palette takes:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ropav/styles/dist/themes/netflix.css" />
```

### Source, through your bundler

Take the entry instead and you get to drop the components you never import. It is a list of
`@import` statements, so anything that follows them resolves it — Vite, webpack, Parcel, a
Tailwind build, `@import` in the browser.

```css
@import "ropav/styles";
```

## Two lines your page owes

The components carry a reset of their own, scoped to the `rp-` prefix: the box model, the borders
and the form controls inside a Ropav component are set up whichever entry you took, and nothing
outside one is touched.

That scope is also the limit. A rule that stops at the component cannot set the page's
`font-family` or `line-height` — those live on `html` and belong to you.

```css
html {
  font-family: system-ui, sans-serif;
  line-height: 1.5;
}
```

Any ordinary reset already sets them, and so does a Tailwind build. If nothing on your page does,
the components inherit whatever the browser defaults to, which is a serif.

::: tip Upgrading from 0.8
`ropav/styles` used to include Tailwind's preflight, which reset your whole page, and
`ropav/styles/no-preflight` was the entry for apps that would rather it did not. There is one
stylesheet now and it resets nothing outside a component; `no-preflight` is an alias for it, and
goes away in 0.10.0. If your page was relying on the preflight for the two lines above, this is
where they went.
:::

### If you write Tailwind classes against these tokens

`bg-accent`, `text-muted`, `rounded-component` and the rest exist because this package was built
with Tailwind and its theme leaked out as utilities. That is ending. One entry keeps them reachable
in the meantime, beside the stylesheet rather than instead of it:

```css
@import "ropav/styles";
@import "ropav/styles/tailwind";
```

::: warning Named after the vendor, and going in 0.10.0
Every other entry has stopped naming a toolchain. This one names it because the name is the
notice — it sits in your import line, and there is no release where it is the recommended way to
reach a token.

Read one directly instead. It works with any toolchain and with none:

```css
.thing {
  background-color: var(--accent);
  color: var(--accent-foreground);
}
```
:::

## Importing only what you need

If you ship only a handful of components, take their CSS one file at a time instead of the whole
entry. These are subpaths of `@ropav/styles` rather than of `ropav`, so install it yourself as
well — a package manager that does not flatten `node_modules` will not resolve a dependency's
dependency. Everything the components stand on comes first, once:

```css
@import "@ropav/styles/base/reset.css";
@import "@ropav/styles/base/base.css" layer(base);
@import "@ropav/styles/base/scrollbar.css" layer(base);
@import "@ropav/styles/motion.css";
@import "@ropav/styles/slots.css";
@import "@ropav/styles/animations.css";
@import "@ropav/styles/themes/default";
@import "@ropav/styles/themes/shared/tokens.css";

@import "@ropav/styles/components/button.css" layer(components);
@import "@ropav/styles/components/chip.css" layer(components);
```

None of the first block is optional, and leaving one out fails quietly rather than loudly:
`slots.css` registers the custom properties a rule composes a shadow or a transform through, and
an unregistered one takes its whole declaration down to the property's initial value — a border
sized `1px` in the source rendering as no border at all. `motion.css` is the switch that reduced
motion turns off; `tokens.css` holds every size, weight and curve a rule names.

The layer wrapper on the components is not optional either — a component rule has to land in
`components` for a utility you pass through `class` to win on layer order.

The JavaScript side is already per-component: every component has its own subpath, so a bundler
drops what you never import.

```ts
import { Button } from "ropav/button";
```

## First component

```vue
<script setup lang="ts">
import { Button } from "ropav";
</script>

<template>
  <Button variant="primary">Get started</Button>
</template>
```

If it renders as a plain browser button, the stylesheet never arrived — check that it is imported.
If it renders styled but in the wrong colours, a theme is loaded and the palette is not: check
`data-theme`. If it renders styled but in a serif, the two lines above are missing.
