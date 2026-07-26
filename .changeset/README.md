# Changesets

Add a changeset when a package change should appear in the next release:

```bash
pnpm changeset
```

CI does not require a changeset. Package changes without one are verified normally but remain
unreleased until a later changeset covers them. Repository-only changes do not need an empty
changeset. See [`docs/releasing.md`](../docs/releasing.md) for publishing, tag recovery, and
new-package bootstrap instructions.
