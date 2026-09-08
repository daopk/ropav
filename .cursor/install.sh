#!/usr/bin/env bash
# Idempotent Cloud Agent install for the ropav monorepo.
# Safe to run repeatedly: it only refreshes toolchain + dependencies to the
# versions pinned by the repository (.nvmrc, package.json packageManager, lockfile).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Node, pinned by .nvmrc, via nvm (pre-installed in the base image).
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"

NODE_VERSION="$(tr -d '[:space:]' < .nvmrc)"
nvm install "$NODE_VERSION"
# Make the pinned version the default so interactive agent shells pick it up.
nvm alias default "$NODE_VERSION"
nvm use "$NODE_VERSION"

# pnpm, pinned by package.json "packageManager", via corepack.
corepack enable
corepack prepare --activate

# Workspace dependencies. --hoist matches the documented dev setup; --frozen-lockfile
# keeps installs reproducible and fails fast if the lockfile drifts.
pnpm install --hoist --frozen-lockfile

# Playwright browser for the @ropav/testing browser test project. The base image
# already ships the required system libraries, so only the browser binary is fetched.
pnpm --filter @ropav/testing exec playwright install chromium

echo "ropav install complete: node $(node -v), pnpm $(pnpm -v)"
