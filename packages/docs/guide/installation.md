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

Take the entry instead and your build resolves it, which is also what lets you take less of it
([below](#importing-only-what-you-need)). It is a list of `@import` statements, so anything that
follows them resolves it — Vite, webpack, Parcel, a Tailwind build, `@import` in the browser.

```css
@import "ropav/styles";
```

## Two lines your page owes

The components carry a reset of their own, scoped to the `rp-` prefix: the box model, the borders
and the form controls inside a Ropav component are set up, and nothing outside one is touched.

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

## Reading a token

Every colour, radius and curve this package paints with is a custom property, and reading one
takes no toolchain at all:

```css
.thing {
  background-color: var(--rp-accent);
  color: var(--rp-accent-foreground);
}
```

The same names work inline in a Tailwind build, where the square brackets are what say "this
value, not a name from my theme":

```html
<p class="bg-[var(--rp-accent)] text-[var(--rp-accent-foreground)]">…</p>
```

The radius scale is the one place to read twice. `--rp-radius` is the scale, and the steps are
multiples of it, so a `data-theme` that sets its own `--rp-radius` moves all of them at once:

```html
<div class="rounded-[calc(var(--rp-radius)*3)]">…</div>
```

### Reading one as a utility

Square brackets work everywhere and read like an escape hatch. To spell `bg-accent` instead, map
the tokens your call sites actually use into Tailwind's own namespaces — in your app, not here,
because a component library has no business shipping one toolchain's interop:

```css
@import "tailwindcss";
@import "ropav/styles";

@theme inline {
  --color-accent: var(--rp-accent);
  --color-muted: var(--rp-muted);
  --color-surface: var(--rp-surface);
}
```

`inline` is the load-bearing word: it substitutes the token into the utility, so `bg-accent`
compiles to `var(--rp-accent)` and resolves against the element wearing the class. Declared
without it these would resolve once on `:root` and freeze the root theme's palette into every
`data-theme` subtree.

Map only the names you spell. A mapping that carries the whole token set is mostly names nothing
writes, and a name nothing writes cannot be found to be wrong.

[Tokens](/theming/tokens) lists the names.

## Importing only what you need

`ropav/styles` is every component's rules at once, and most of it is rules for components a given
app never draws. The same stylesheet comes in parts: the core, which everything stands on, and one
entry per component.

```css
@import "ropav/styles/core";
@import "ropav/styles/button";
@import "ropav/styles/modal";
@import "ropav/styles/textfield";
```

The core comes first and once: the layer order, the reset, the motion switch, the custom
property registrations, the keyframes, the default theme, the tokens and the utility classes. A
component entry is that component's rules in the `components` layer, plus the rules of whatever
it draws itself — `modal` brings the close button its `ModalCloseTrigger` renders. What you put
inside it is yours to import: a `TextField` holding a `Label` and an `Input` takes `label` and
`input` as well. The names are the component subpaths, `ropav/<name>`.

Order between component entries does not matter, and neither does importing one twice; your
bundler keeps the first copy.

### Loading the rest later

An app whose components arrive after its first paint — a route split into its own chunk, a feature
loaded only when it is asked for — can take the core and its own components up front, and every
other component's rules when the code that draws them loads:

```ts
// Wherever the late code is loaded: the rules arrive with it.
const [page] = await Promise.all([import("./settings-page"), import("ropav/styles/components")]);
```

`ropav/styles/components` is every component's rules and nothing else. Wait for it before
rendering the components it styles, or they paint unstyled for a frame. Two rules make loading it
late safe:

- **Never load `ropav/styles` or `ropav/styles/core` late.** Both carry the default theme. Your
  own tokens sit in `@layer theme` after it, and a theme arriving later lands after them and wins.
- **Load the core first.** It fixes the layer order for the page; every part restates that order,
  so a part read first still sets it right, but the core is what the rest is written on.

Rules already on the page are restated in the same order, so the late copy lands where the page
already is.

### From `@ropav/styles` directly

The parts above are built from `@ropav/styles`'s own files, and those are importable one at a
time too. This is the lower level: you list everything a component draws yourself, and you add
the layer wrapper. Install `@ropav/styles` as well — a package manager that does not flatten
`node_modules` will not resolve a dependency's dependency.

```css
@import "@ropav/styles/core.css";

@import "@ropav/styles/components/close-button.css" layer(components);
@import "@ropav/styles/components/modal.css" layer(components);
```

`core.css` is the whole first block. The layer wrapper on the components is not optional — a
component rule has to land in `components` for a utility you pass through `class` to win on layer
order. `@ropav/styles/components.css` is every component file, wrapped.

The JavaScript side is already per-component: every component has its own subpath, so a bundler
drops what you never import.

```ts
import { Button } from "ropav/button";
```

## Pointing an agent at this

A coding agent writes better Ropav if it reads the arrangement rules first — they are in
`node_modules/ropav/AGENTS.md` once the package is installed, and every component's arrangement
and props are in [llms-full.txt](https://ropav.netlify.app/llms-full.txt).

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
