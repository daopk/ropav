# Ropav

A Vue 3 component library built on [Vue Vapor](https://github.com/vuejs/core-vapor), styled by
[`@ropav/styles`](packages/styles) and Tailwind CSS v4. Published on npm as
[`ropav`](https://www.npmjs.com/package/ropav).

> Ropav is a port of [HeroUI v3](https://github.com/heroui-inc/heroui) to Vue Vapor: the style layer is
> vendored from `@heroui/styles@3.2.4`, the behaviour layer is re-implemented from React Aria.

## Packages

| Package              | Description                                      |
| -------------------- | ------------------------------------------------ |
| `packages/ropav`     | The component library                            |
| `packages/styles`    | CSS + `tv()` variants (`@ropav/styles`)          |
| `packages/storybook` | Storybook — the only place to see components run |
| `packages/testing`   | Shared test harness (jsdom + Playwright browser) |

## Calendar systems

The calendars, fields and pickers build **Gregorian** dates whatever calendar the locale asks
for. A factory that can answer for any identifier has to carry the arithmetic for every system
behind it, and because the default is a static import, nothing about it can be dropped by a
build — so every app shipping a date picker would carry all of them.

An app serving a locale that uses another system passes the full factory back:

```vue
<script setup lang="ts">
import { DatePicker, createCalendar } from "ropav";
</script>

<template>
  <DatePicker :create-calendar="createCalendar" />
</template>
```

`createCalendar` takes the prop on `Calendar`, `RangeCalendar`, `DateField`, `DatePicker` and
`DateRangePicker`. A narrower factory works too, if only some systems are worth the weight.

## Development

Requires Node.js 22+ and pnpm 10+.

```bash
pnpm i --hoist   # install
pnpm dev         # Storybook on http://127.0.0.1:6006
pnpm build       # build every package
pnpm lint        # ESLint
pnpm typecheck   # vue-tsc
pnpm test        # Vitest — jsdom + browser (needs `playwright install chromium` once)
```

## License

Apache License 2.0 — see [LICENSE](./LICENSE), which keeps the original copyright.
