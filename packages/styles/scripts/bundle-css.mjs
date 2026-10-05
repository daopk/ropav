/**
 * Compiles a stylesheet entry into the single file a browser can load on its own.
 *
 * Shared with `packages/ropav`, whose entry is this package's plus its own override layer, so
 * both published packages offer the same artifact built the same way. Reached from there by
 * resolving this package's `package.json`; it never runs from a tarball, only from the repo.
 *
 * The entries are plain CSS, so this only has to follow the `@import` graph, lower what the
 * browser floor does not have, and minify. That is Lightning CSS's whole job.
 */
/* eslint-disable no-console */
import { readFile, writeFile } from "fs/promises";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

import { bundleAsync, Features } from "lightningcss";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stylesRoot = path.resolve(__dirname, "..");

/**
 * The browser floor, stated rather than queried.
 *
 * Lightning CSS reads a target as `major << 16 | minor << 8`. A browserslist query would put the
 * floor at the mercy of a data update: the same source would start emitting different CSS on a
 * lockfile bump, and the one thing a floor has to do is not move on its own.
 */
/** @param {number} major @param {number} [minor] */
const version = (major, minor = 0) => (major << 16) | (minor << 8);

const TARGETS = { chrome: version(111), firefox: version(128), safari: version(16, 4) };

/**
 * Nesting is lowered whatever the targets say. The floor above already forces it — relaxed
 * nesting, where a nested selector needs no `&`, is younger than every one of these versions —
 * but the source is written in it throughout and a raised floor should not silently start
 * shipping it.
 *
 * `light-dark()` is left alone, and has to be. Lowering it makes Lightning CSS write a pair of
 * `--lightningcss-*` custom properties into every rule that mentions `color-scheme`, which is
 * both a size no one asked for and a set of names this package would then be declaring.
 *
 * `:dir()` is left alone for a worse reason: it lowers to a list of nineteen `:lang()` checks,
 * which is a different selector. A paragraph marked `lang="ar"` inside `dir="ltr"` would match,
 * and `dir="rtl"` with no language at all would not. Every `:dir()` in the source names the
 * `[dir]` attribute beside it inside a `:where()`, so a browser that does not know the
 * pseudo-class drops that one branch and keeps matching on the attribute.
 */
const INCLUDE = Features.Nesting;
const EXCLUDE = Features.LightDark | Features.DirSelector;

/**
 * The `exports` entry for `subpath`, and what its `*` stood for.
 *
 * A literal key wins; otherwise the pattern with the longest part before its `*` does, which is
 * Node's rule too — `./components/*.css` answers `./components/button.css` ahead of
 * `./components/*`, the script half of the map.
 */
/** @typedef {string | Record<string, string>} ExportEntry */

/**
 * @param {Record<string, ExportEntry> | undefined} exports
 * @param {string} subpath
 * @returns {{ entry: ExportEntry, star: string | undefined } | undefined}
 */
const matchExport = (exports, subpath) => {
  if (exports?.[subpath]) return { entry: exports[subpath], star: undefined };

  const [key] = Object.keys(exports ?? {})
    .filter((candidate) => {
      const [before = "", after, extra] = candidate.split("*");

      if (after === undefined || extra !== undefined) return false;

      return (
        subpath.length >= before.length + after.length &&
        subpath.startsWith(before) &&
        subpath.endsWith(after)
      );
    })
    .sort((a, b) => b.indexOf("*") - a.indexOf("*") || b.length - a.length);

  if (!key) return undefined;

  const [before = "", after = ""] = key.split("*");

  return {
    entry: /** @type {ExportEntry} */ (exports?.[key]),
    star: subpath.slice(before.length, subpath.length - after.length),
  };
};

/**
 * `@import` targets, resolved the way a bundler resolves them rather than as paths.
 *
 * `packages/ropav`'s entries need this: they import `@ropav/styles` by name, and the answer
 * is whatever the `style` condition in that package's `exports` names — the same condition a
 * consumer's build reads, so the artifact is built through the map it is published behind.
 */
const resolver = {
  /** @param {string} file */
  read: (file) => readFile(file, "utf8"),

  /** @param {string} specifier @param {string} from */
  resolve(specifier, from) {
    if (specifier.startsWith(".") || path.isAbsolute(specifier)) {
      return path.resolve(path.dirname(from), specifier);
    }

    const parts = specifier.split("/");
    const name = parts.splice(0, specifier.startsWith("@") ? 2 : 1).join("/");
    const subpath = parts.length > 0 ? `./${parts.join("/")}` : ".";

    const require = createRequire(from);
    const manifest = require.resolve(`${name}/package.json`);
    const match = matchExport(require(manifest).exports, subpath);
    const entry = match?.entry;
    const named = typeof entry === "string" ? entry : (entry?.["style"] ?? entry?.["default"]);
    const target = match?.star === undefined ? named : named?.replaceAll("*", match.star);

    if (!target) throw new Error(`\`${specifier}\` names no stylesheet (imported by ${from})`);

    return path.resolve(path.dirname(manifest), target);
  },
};

/**
 * The compiled stylesheet for `entry`, as text. What `bundleCss` writes, for a test to read.
 *
 * @param {string} entry Absolute path.
 * @returns {Promise<string>}
 */
export async function compileCss(entry) {
  const { code } = await bundleAsync({
    exclude: EXCLUDE,
    filename: entry,
    include: INCLUDE,
    minify: true,
    resolver,
    targets: TARGETS,
  });

  return code.toString();
}

/** @param {{ entry: string, out: string }} paths Absolute paths. */
export async function bundleCss({ entry, out }) {
  const code = await compileCss(entry);

  await writeFile(out, code);

  console.log(`✓ ${path.relative(stylesRoot, out)} — ${code.length} bytes`);
}
