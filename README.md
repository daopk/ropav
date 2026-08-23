# Vue component library

A Vue 3 component library built on [Vue Vapor](https://github.com/vuejs/core-vapor), styled by
[`@ropav/styles`](packages/styles) and Tailwind CSS v4.

## Packages

| Package              | Description                                      |
| -------------------- | ------------------------------------------------ |
| `packages/ropav`     | The component library                            |
| `packages/styles`    | CSS + `tv()` variants (`@ropav/styles`)          |
| `packages/storybook` | Storybook — the only place to see components run |
| `packages/testing`   | Shared test harness (jsdom + Playwright browser) |

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

Apache License 2.0 — see [LICENSE](./LICENSE).
