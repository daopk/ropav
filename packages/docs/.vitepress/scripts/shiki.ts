/**
 * The docs site carries its own shiki, because the browser needs one to repaint a playground's
 * code block after a control moves, and VitePress does not expose the highlighter it built.
 *
 * Two copies is fine as long as they are the same copy. `<pre>` markup is shiki's own output, so
 * a version apart means a repainted block stops matching the ones around it — in ways too small
 * to notice and too many to chase. An alpha of VitePress can move its shiki without anything
 * here changing, which is exactly the bump nobody would think to check.
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { DOCS } from "./shared";

interface Manifest {
  dependencies?: Record<string, string>;
  version: string;
}

const manifest = (path: string): Manifest => JSON.parse(readFileSync(path, "utf8")) as Manifest;

const resolved = (specifier: string, from?: NodeRequire): Manifest =>
  manifest(from ? from.resolve(specifier) : fileURLToPath(import.meta.resolve(specifier)));

export const assertShikiMatchesVitePress = (): void => {
  const drifted: string[] = [];

  const ours = resolved("shiki/package.json");
  const theirs = resolved(
    "shiki/package.json",
    createRequire(fileURLToPath(import.meta.resolve("vitepress/package.json"))),
  );

  if (ours.version !== theirs.version) {
    drifted.push(`shiki: this package has ${ours.version}, vitepress resolves ${theirs.version}`);
  }

  /*
   * `@shikijs/langs` and `@shikijs/themes` are declared here as well, for the deep imports the
   * browser highlighter makes. They are not resolved: neither exports its own `package.json`.
   * They do not need to be — shiki pins both to its exact version, so the only way they can
   * drift is if this package's pins fall behind shiki's, which is what this compares.
   */
  const declared = manifest(join(DOCS, "package.json")).dependencies ?? {};

  for (const [name, wanted] of Object.entries(ours.dependencies ?? {})) {
    const pinned = declared[name];

    if (pinned !== undefined && pinned !== wanted) {
      drifted.push(`${name}: this package pins ${pinned}, shiki ${ours.version} wants ${wanted}`);
    }
  }

  if (drifted.length === 0) return;

  throw new Error(
    `shiki has drifted, so a repainted code block would stop matching the ones around it:\n  ` +
      `${drifted.join("\n  ")}\n` +
      `Pin this package to the versions VitePress resolves.`,
  );
};
