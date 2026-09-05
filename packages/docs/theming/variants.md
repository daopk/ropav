---
title: Variants
description: Going from props to class names without going through a component.
---

# Variants

Every component's class list is produced by a `tv()` recipe, and the recipes are exported. They
do nothing but map props to class names — no Vue, no DOM, no state.

```ts
import { buttonVariants, type ButtonVariants } from "@ropav/styles";

buttonVariants({ variant: "primary", size: "sm" });
// "rp-button rp-button--primary rp-button--sm"
```

That is useful in three places.

## Styling an element the library does not render

A link that should look like a button, a native `<button>` inside a third-party widget, a cell
rendered by a table you do not own:

```vue
<script setup lang="ts">
import { buttonVariants } from "@ropav/styles";
</script>

<template>
  <RouterLink :class="buttonVariants({ variant: 'secondary' })" to="/docs">Docs</RouterLink>
</template>
```

You get the appearance and none of the behaviour — no press handling, no focus ring wiring, no
pending state. For anything interactive, prefer the component.

## Deriving the prop types

The recipe's own types are where a component's prop unions come from, so you can name them
directly:

```ts
import type { ButtonVariants } from "@ropav/styles";

type Size = ButtonVariants["size"]; // "sm" | "md" | "lg"
```

## Shipping less

Each recipe has its own subpath, so a bundler drops the rest:

```ts
import { buttonVariants } from "@ropav/styles/components/button";
```

The CSS is per component too — see [Installation](/guide/installation#importing-only-what-you-need).
