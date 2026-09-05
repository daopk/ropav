/** Paths and helpers the emitters share, so the checker is built once for all of them. */

import type { PropertyMeta } from "vue-component-meta";

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/*
 * Resolved through the package link rather than across the workspace, so this program reaches
 * the library by the same route the site does. The two paths are the same directory but not
 * the same module identity, and a type re-exported through both reads as an ambiguous name.
 */
export const ROPAV = dirname(fileURLToPath(import.meta.resolve("ropav/package.json")));
export const SRC = join(ROPAV, "src");
export const DOCS = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const OUT_DIR = join(DOCS, ".vitepress", "generated");

/** A prop the library declares, rather than one carried in from the DOM's own attributes. */
export const isAuthored = (prop: PropertyMeta): boolean =>
  prop.getDeclarations().some((declaration) => declaration.file.startsWith(SRC));

export const HEADER = `/**
 * GENERATED from the library's own sources — do not edit by hand.
 *
 * Run \`pnpm generate\`, or let \`predev\` / \`prebuild\` do it.
 */`;

export const emit = (name: string, source: string): void => {
  mkdirSync(OUT_DIR, { recursive: true });

  const file = join(OUT_DIR, name);

  writeFileSync(file, source);

  // Handed to the repo formatter rather than matched by hand, the way the theme generator does.
  if (name.endsWith(".ts")) execFileSync("oxfmt", [file], { stdio: "inherit" });
};

/** Keys sorted so an emitted object satisfies the linter. */
export function sorted(this: unknown, _key: string, value: unknown): unknown {
  if (Array.isArray(value) || value === null || typeof value !== "object") return value;

  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
}
