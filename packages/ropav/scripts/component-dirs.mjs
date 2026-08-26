import fs from "node:fs";
import path from "node:path";

/**
 * Every directory under `src/components` falls into one of three buckets, and the whole packaging
 * pipeline reads them from here: `vite.config.ts` for build entries, `update-exports.mjs` for
 * package subpaths, `build.mjs` for the component count. The list used to live in all three, and
 * `build.mjs` had already drifted two names behind the other two.
 */

/**
 * Internal — no export at all, not even from the barrel. These are shared layers the real
 * components are built on: reachable only through the host that wraps them, and a host that keeps
 * one of these parts in its own public API re-exports it under its own name.
 */
export const INTERNAL_DIRS = new Set(["date-input-group", "overlay"]);

/**
 * Public from the main entry but not a component with a subpath of its own. `icons` is a sprite
 * set and `dnd` is a composable surface; neither is a component, so neither answers to
 * `ropav/<name>`.
 */
export const BARREL_ONLY_DIRS = new Set(["dnd", "icons"]);

/*
 * Everything else is a public component with a subpath of its own — `color-input-group` included.
 * It reads like a part of `ColorField`, but standing outside a field the group takes `role="group"`
 * and resolves its own disabled and invalid state, and `ropav@0.3.1` already ships the
 * `./color-input-group` subpath. Only its line in the barrel was ever missing.
 */

/** Directories that never become a build entry or a package subpath. */
export const SKIP_DIRS = new Set([...INTERNAL_DIRS, ...BARREL_ONLY_DIRS]);

/**
 * Read `src/components` and sort its directories into what the packaging pipeline needs.
 *
 * @param {string} componentsDir Absolute or cwd-relative path to `src/components`.
 * @returns {{ components: string[], missingIndex: string[] }} `components` are the directories
 *   that earn a subpath, sorted. `missingIndex` are directories that would have earned one but
 *   have no `index.ts` — a broken component rather than an internal one, so callers report it.
 */
export function readComponentDirs(componentsDir) {
  if (!fs.existsSync(componentsDir)) return { components: [], missingIndex: [] };

  /** @type {string[]} */ const components = [];
  /** @type {string[]} */ const missingIndex = [];

  for (const entry of fs.readdirSync(componentsDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || SKIP_DIRS.has(entry.name)) continue;

    const hasIndex = fs.existsSync(path.join(componentsDir, entry.name, "index.ts"));

    (hasIndex ? components : missingIndex).push(entry.name);
  }

  return { components: components.sort(), missingIndex: missingIndex.sort() };
}
