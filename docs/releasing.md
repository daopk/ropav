# Releasing packages

This workspace releases `ropav`, `@ropav/editor`, and `@ropav/table` together at a single version
with [`bumpp`](https://www.npmjs.com/package/bumpp). Release notes are generated from Conventional
Commits, and packages are published from GitHub Actions with npm Trusted Publishing.

## Release

With a clean working tree, run:

```bash
pnpm release
```

`bumpp` bumps all three packages to the same next version (patch/minor/major prompt), runs
`pnpm run changelog` to regenerate each package changelog from commits since the last `v*` tag,
then commits `chore(release): vX.Y.Z`, tags `vX.Y.Z`, and pushes the commit and tag.

Every push to `main` runs the full quality suite. When the pushed commit is a release commit
(message starts with `chore(release): v`), the release job rebuilds the packages, checks the
built bundles, and publishes them to npm. Change the release commit message in the `release`
script and the release workflow will need the matching prefix.

## Changelog

`pnpm run changelog` regenerates `packages/*/CHANGELOG.md`. Each changelog covers commits that
touch that package directory since the latest `v*` tag and uses the package's own version header.
The release flow runs this automatically. Changelogs are tracked files (editor and table start as
header-only placeholders), and the release commit includes them via `bumpp --all`, so the working
tree must be clean before `pnpm release`.

## Trusted Publisher configuration

Each npm package is configured as a Trusted Publisher:

- GitHub owner: `daopk`
- Repository: `ropav`
- Workflow filename: `publish.yml`

The workflow uses GitHub-hosted runners, Node 24, and `id-token: write`. Do not add a long-lived
npm publish token to the workflow.
