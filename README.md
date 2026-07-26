# Ropav workspace

This repository is a pnpm monorepo for zero-VDOM Vue Vapor packages.

## Packages

- [`ropav`](./packages/ropav): minimal UI components and public composables for Vue Vapor.
- [`@ropav/editor`](./packages/editor): zero-VDOM rich-text editor built directly on
  `@tiptap/core`.
- [`@ropav/table`](./packages/table): zero-VDOM data table built directly on
  `@tanstack/table-core`.

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
pnpm --filter @ropav/table verify
```

Package-level `verify` commands cover package-owned type, test, build, and bundle behavior. Only
the root `pnpm verify` command enforces lint, formatting, and workspace-wide architecture
contracts.

Contributors should follow the [code architecture guide](./docs/code-architecture.md).
Package versioning, npm Trusted Publishing, and first-release setup are documented in the
[release guide](./docs/releasing.md).
