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
 * `@import` targets, resolved the way a bundler resolves them rather than as paths.
 *
 * Only `packages/ropav`'s entry needs this: it imports `@ropav/styles` by name, and the answer
 * is whatever the `style` condition in that package's `exports` names — the same condition a
 * consumer's build reads, so the artifact is built through the map it is published behind.
 */
const resolver = {
  read: (file) => readFile(file, "utf8"),

  resolve(specifier, from) {
    if (specifier.startsWith(".") || path.isAbsolute(specifier)) {
      return path.resolve(path.dirname(from), specifier);
    }

    const parts = specifier.split("/");
    const name = parts.splice(0, specifier.startsWith("@") ? 2 : 1).join("/");
    const subpath = parts.length > 0 ? `./${parts.join("/")}` : ".";

    const require = createRequire(from);
    const manifest = require.resolve(`${name}/package.json`);
    const entry = require(manifest).exports?.[subpath];
    const target = typeof entry === "string" ? entry : (entry?.style ?? entry?.default);

    if (!target) throw new Error(`\`${specifier}\` names no stylesheet (imported by ${from})`);

    return path.resolve(path.dirname(manifest), target);
  },
};

export async function bundleCss({ entry, out }) {
  const { code } = await bundleAsync({
    exclude: EXCLUDE,
    filename: entry,
    include: INCLUDE,
    minify: true,
    resolver,
    targets: TARGETS,
  });

  await writeFile(out, code);

  console.log(`✓ ${path.relative(stylesRoot, out)} — ${code.length} bytes`);
}
