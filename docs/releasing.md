# Releasing

This repository publishes `ropav` with [`bumpp`](https://www.npmjs.com/package/bumpp). Release notes
are generated from Conventional Commits, and the package is published from GitHub Actions with npm
Trusted Publishing.

## Release

With a clean working tree, run:

```bash
pnpm release
```

`bumpp` bumps the package to the next version (patch/minor/major prompt), runs `pnpm run changelog`
to regenerate the changelog from commits since the last `v*` tag, then commits
`chore(release): vX.Y.Z`, tags `vX.Y.Z`, and pushes the commit and tag.

Every push to `main` runs the full quality suite. When the pushed commit is a release commit
(message starts with `chore(release): v`), the release job rebuilds the package, checks the built
bundles, and publishes it to npm. Change the release commit message in the `release` script and the
release workflow will need the matching prefix.

## Changelog

`pnpm run changelog` regenerates `CHANGELOG.md` from commits since the latest `v*` tag. The release
flow runs this automatically. The changelog is a tracked file, so the working tree must be clean
before `pnpm release`.

## Trusted Publisher configuration

The npm package is configured as a Trusted Publisher:

- GitHub owner: `daopk`
- Repository: `ropav`
- Workflow filename: `publish.yml`

The workflow uses GitHub-hosted runners, Node 24, and `id-token: write`. Do not add a long-lived npm
publish token to the workflow.
