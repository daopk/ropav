# Ropav

Minimal UI components for Vue Vapor.

Ropav components require Vapor mode. Use `createVaporApp`, or install Vue's
Vapor interop plugin in a regular app.

```ts
import { createVaporApp } from 'vue';

createVaporApp(App).mount('#app');
```

or

```ts
import { createApp, vaporInteropPlugin } from 'vue';

createApp(App).use(vaporInteropPlugin).mount('#app');
```

## Install

```bash
pnpm add ropav
```

## Setup

```ts
import 'ropav/base.css';
```

Import the components you need:

```ts
import { Button } from 'ropav';
```

## Icons

Ropav provides a compiler for
[`unplugin-icons`](https://github.com/unplugin/unplugin-icons) that emits each
icon as a zero-VDOM Vue Vapor component.

Install `unplugin-icons`, a matching version of `@vue/compiler-vapor`, and the
Iconify collection you want to use:

```bash
pnpm add -D unplugin-icons @vue/compiler-vapor @iconify-json/lucide
```

Pass `vaporIconCompiler` to `unplugin-icons`:

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import Icons from 'unplugin-icons/vite';
import { vaporIconCompiler } from 'ropav/unplugin-icons';

export default defineConfig({
  plugins: [vue({ features: { vapor: true } }), Icons({ compiler: vaporIconCompiler() })],
});
```

Icons can then be imported on demand. Only imported icons are included in the
application bundle.

```vue
<script setup lang="ts" vapor>
import IconSearch from '~icons/lucide/search';
</script>

<template>
  <IconSearch aria-hidden="true" />
</template>
```

## Styling contract

Use typed `classNames` and `styles`, documented state attributes, and variables listed in the packaged styles manifest. DOM nesting, internal selectors and undocumented variables are private implementation details.

See the [Public Styles API](./docs/public-styles-api.md) and [public token table](./docs/public-tokens.md). Consumers can declare `reset, ropav.tokens, ropav.components, app` to establish their cascade layer order.

For headless Tooltip, HoverCard and custom menu markup, see the
[public floating API](./docs/public-floating-api.md).
