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

Headless state utilities are available from `ropav/composables`. See the
[public composables API](./docs/public-composables-api.md) for their controlled and uncontrolled
state contracts.

## Custom color contrast

`autoContrast` selects foreground colors for preset colors and opaque custom color literals. A
translucent custom color depends on the surface behind the component, so its contrast cannot be
determined from the color alone. Pass `contrastColor` explicitly whenever a custom background has
alpha:

```vue
<Button color="rgba(255, 255, 255, 0.2)" contrast-color="var(--rp-color-white)" variant="solid">
  Continue
</Button>
```

In development, Ropav warns when auto contrast receives a translucent custom color without an
explicit `contrastColor`. The production fallback remains `var(--rp-color-white)`.

## Progress and interactive ranges

Use `Progress` for read-only status and `Slider` when the user can change the value. A media seek
control can draw buffered ranges below the played range, reveal its thumb during interaction, and
preview the value under the pointer:

```vue
<Slider
  v-model="currentTime"
  :max="duration"
  thumb="interaction"
  :tooltip="{ anchor: 'pointer' }"
  :format-value="formatTime"
>
  <template #track-underlay="{ getPercent }">
    <span
      v-for="range in bufferedRanges"
      :key="range.start"
      class="buffered-range"
      :style="{
        left: `${getPercent(range.start)}%`,
        width: `${getPercent(range.end) - getPercent(range.start)}%`,
      }"
    />
  </template>
  <template #tooltip-content="{ formattedValue }">
    {{ formattedValue }}
  </template>
</Slider>
```

`track-underlay` and `track-overlay` are decorative layers below and above the selected range. Both
receive the normalized slider state and a clamped `getPercent(value)` helper, so consumers can draw
segments, markers, waveforms, or other track content without replacing slider behavior. Their
coordinate space follows the thumb travel, so percentage positions stay aligned with the control.
Set `:thumb="false"` to hide only the visual thumb while preserving the native input, hit area, and
keyboard behavior. An object can combine visibility and geometry, for example
`:thumb="{ visibility: 'interaction', size: 20 }"`.

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

## Development

Contributors should follow the [code architecture guide](./docs/code-architecture.md) for component,
composable, utility, dependency, and testing conventions. Run `pnpm run verify` before submitting a
change.
