# Ropav workspace

This repository is a pnpm monorepo for zero-VDOM Vue Vapor packages.

## Packages

- [`ropav`](./packages/ropav): minimal UI components and public composables for Vue Vapor.
- [`@ropav/editor`](./packages/editor): zero-VDOM rich-text editor built directly on
  `@tiptap/core`.

## Development

Install dependencies and run the full workspace quality suite:

```bash
pnpm install
pnpm verify
```

Use pnpm filters to target one package:

```bash
pnpm --filter ropav test
pnpm --filter ropav build
pnpm --filter @ropav/editor verify
```

Contributors should follow the [code architecture guide](./docs/code-architecture.md).
Package versioning, npm Trusted Publishing, and first-release setup are documented in the
[release guide](./docs/releasing.md).
