---
title: Installation
description: The package, the stylesheet, and how to import less of it.
---

# Installation

Ropav needs Vue 3.6 or newer — Vapor Mode is what it is built on — and Tailwind CSS 4.

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

Import it once, from your app's own CSS:

```css
@import "tailwindcss";
@import "ropav/styles";
```

That single line brings in, in layer order (`theme, base, components, utilities`): Tailwind's own
parts, the base styles and the scrollbar system, one rule set per component, the default theme's
tokens for light and dark, and the utilities and custom variants the components rely on.

### If your app already resets

`ropav/styles` includes Tailwind's preflight. An app that already ships a reset — or that runs its
own Tailwind build — wants the other entry, which is identical in every other way:

```css
@import "ropav/styles/no-preflight";
```

### Telling Tailwind where to look

Tailwind only emits the classes it can see. Ropav's components name theirs inside the package, so
point `@source` at it or the components render unstyled:

```css
@source "../node_modules/ropav/dist/**/*.js";
```

## Importing only what you need

The whole stylesheet is the simple path. If you ship only a handful of components, take their CSS
one file at a time instead:

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

If it renders as unstyled text, the stylesheet is missing. If it renders as a plain browser
button, Tailwind is not scanning the package — see above.
