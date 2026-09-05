# Ropav

A Vue 3 component library built on [Vue Vapor](https://github.com/vuejs/core-vapor), styled by
[`@ropav/styles`](https://www.npmjs.com/package/@ropav/styles) and Tailwind CSS v4. Published on
npm as [`ropav`](https://www.npmjs.com/package/ropav).

**[Documentation](https://ropav.netlify.app)** · [Components](https://ropav.netlify.app/components/)
· [Theming](https://ropav.netlify.app/theming/) · [Storybook](https://ropav-storybook.netlify.app)

> Ropav is a port of [HeroUI v3](https://github.com/heroui-inc/heroui) to Vue Vapor: the style layer is
> vendored from `@heroui/styles@3.2.4`, the behaviour layer is re-implemented from React Aria.

## Packages

| Package              | Description                                           |
| -------------------- | ----------------------------------------------------- |
| `packages/ropav`     | The component library                                 |
| `packages/styles`    | CSS + `tv()` variants (`@ropav/styles`)               |
| `packages/docs`      | The documentation site                                |
| `packages/storybook` | Storybook — every component, documented here or not   |
| `packages/testing`   | Shared test harness (jsdom + Playwright browser)      |

## Calendar systems

The calendars, fields and pickers build **Gregorian** dates whatever calendar the locale asks
for — a deliberate default, and about bundle weight rather than correctness. An app serving a
locale that uses another system opts in:

```vue
<script setup lang="ts">
import { DatePicker, createCalendar } from "ropav";
</script>

<template>
  <DatePicker :create-calendar="createCalendar" />
</template>
```

Why it works that way, and how to opt in for only some systems, is in
[Calendar systems](https://ropav.netlify.app/guide/calendar-systems).

## Development

Requires Node.js 22+ and pnpm 10+.

```bash
pnpm i --hoist   # install
pnpm dev         # Storybook on http://127.0.0.1:6006
pnpm build       # build every package
pnpm lint        # oxlint
pnpm typecheck   # vue-tsc
pnpm test        # Vitest — jsdom + browser (needs `playwright install chromium` once)
```

## License

Apache License 2.0 — see [LICENSE](./LICENSE), which keeps the original copyright.
