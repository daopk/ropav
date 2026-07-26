# Changesets

Add a changeset for user-facing package changes:

```bash
pnpm changeset
```

Pull requests that change a publishable package must include release intent. For repository-only
changes that do not affect a published package, add an empty changeset:

```bash
pnpm changeset add --empty
```

The generated Changesets release pull request is exempt because it has already consumed the source
changesets. See [`docs/releasing.md`](../docs/releasing.md) for publishing and new-package bootstrap
instructions.
