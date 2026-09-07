---
title: Installation
description: The package, the stylesheet, and how to import less of it.
---

# Installation

Ropav needs Vue 3.6 or newer — Vapor Mode is what it is built on. Tailwind CSS 4 is needed only
by one of the two ways to take the stylesheet, and the other one needs no build step at all.

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

Two ways in. They render the same components; what differs is whether anything has to compile.

### Compiled, no build step

One finished file — every rule resolved, nothing left to process. Take it from your CSS:

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

### Source, compiled by your own Tailwind

If your app already runs Tailwind CSS 4, take the entry instead. Your build resolves it, and you
get to drop the components you never import.

```css
@import "tailwindcss";
@import "ropav/styles";
```

::: warning It fails quietly
These entries are `@import` statements, not CSS. Without a Tailwind 4 toolchain the import still
succeeds and the app renders unstyled — nothing errors. If your components come out looking like
bare HTML, this is why; take the compiled file above.
:::

### If your app already resets

`ropav/styles` includes Tailwind's preflight, which resets the whole page. An app that already
ships a reset — or that runs its own Tailwind build, which brings one — wants the other entry:

```css
@import "ropav/styles/no-preflight";
```

The components look after themselves either way. They carry a reset of their own, scoped to the
prefix, so the box model, the borders and the form controls inside a Ropav component are the same
under both entries — and nothing outside one is touched.

::: tip Two lines your page still owes
The scoped reset stops at the component, so it cannot set the page's `font-family` or
`line-height` — those live on `html` and belong to you. Any ordinary reset already sets them; if
yours does not, the components inherit whatever the browser defaults to, which is a serif.

```css
html {
  font-family: system-ui, sans-serif;
  line-height: 1.5;
}
```
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

Also the Tailwind path. If you ship only a handful of components, take their CSS one file at a
time instead of the whole entry:

```css
@import "tailwindcss";

@import "@ropav/styles/components/button.css" layer(components);
@import "@ropav/styles/components/chip.css" layer(components);
@import "@ropav/styles/themes/shared/theme.css";
@import "@ropav/styles/themes/default";
```

The layer wrapper is not optional — component rules have to land in `components` for a utility you
pass through `class` to win on layer order.

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

If it renders as a plain browser button, the stylesheet never arrived — either it is not imported,
or it is one of the source entries and nothing compiled it. If it renders styled but in the wrong
colours, a theme is loaded and the palette is not: check `data-theme`.
