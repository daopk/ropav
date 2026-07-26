# Releasing packages

This workspace uses Changesets for independent package versions and npm Trusted Publishing for
token-free releases from GitHub Actions.

## Normal changes

Add a changeset for every user-facing package change:

```bash
pnpm changeset
```

Use an empty changeset when a pull request touches a publishable package but does not change its
released behavior:

```bash
pnpm changeset add --empty
```

On `main`, Changesets creates or updates a release pull request. Merging that pull request publishes
the unpublished package versions and pushes package-specific tags such as `ropav@0.1.9`.

The release workflow only publishes from `refs/heads/main`. Its tag reconciliation checks npm's
`gitHead` metadata before creating a missing tag, so reruns can recover from a partial multi-package
publish or a transient Git push failure without tagging an unpublished version.

## Trusted Publisher configuration

Configure each npm package separately:

- GitHub owner: `daopk`
- Repository: `ropav`
- Workflow filename: `publish.yml`
- Allowed action: `npm publish`

The workflow uses GitHub-hosted runners, Node 24, and `id-token: write`. Do not add a long-lived npm
publish token to the workflow.

## First publish of a new package

npm requires a package to exist before it can have a Trusted Publisher. The first version of a new
package, including `@ropav/editor`, therefore needs a one-time maintainer-authenticated bootstrap:

1. Confirm ownership of the npm scope and merge the publishable package on `main` with an empty
   changeset. The OIDC release job may remain red until the bootstrap is complete.
2. Check out that exact `main` commit, run `pnpm verify`, authenticate to npm with 2FA, and publish
   the initial version:

   ```bash
   pnpm --filter @ropav/editor publish --access public
   ```

3. From the same commit, reconcile and push the package tag:

   ```bash
   pnpm release:reconcile-tags
   git push origin --follow-tags
   ```

4. Configure the package's Trusted Publisher using the values above, then rerun the release workflow
   on `main`.

All later versions use the normal Changesets and OIDC workflow.
