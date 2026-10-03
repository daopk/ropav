import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

import { DOCS, ROPAV } from "./scripts/shared";

/*
 * The guide's composables page is written by hand, and the public surface it describes is decided
 * in `scripts/composable-modules.mjs`. This holds the two together: every function a consumer can
 * import has a heading, and no heading names one they cannot.
 */

const { PUBLIC_MODULES } = (await import(
  pathToFileURL(join(ROPAV, "scripts/composable-modules.mjs")).href
)) as { PUBLIC_MODULES: string[] };

const DECLARED = /^export (?:const|function)\s+(\[[^\]]*\]|[A-Za-z0-9_$]+)/gm;

/** Every runtime name the public composable modules export. */
const exported = PUBLIC_MODULES.flatMap((module) => {
  const source = readFileSync(join(ROPAV, "src/composables", `${module}.ts`), "utf8");

  return [...source.matchAll(DECLARED)].flatMap((match) =>
    (match[1] ?? "")
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map((name) => name.trim()),
  );
}).filter(Boolean);

/** The names the page documents, one `###` heading each or a comma-separated pair. */
const documented = readFileSync(join(DOCS, "guide/composables.md"), "utf8")
  .split("\n")
  .filter((line) => line.startsWith("### "))
  .flatMap((line) => line.slice(4).split(","))
  .map((name) => name.trim());

describe("the composables guide", () => {
  it("documents every public composable", () => {
    expect(exported.filter((name) => !documented.includes(name))).toEqual([]);
  });

  it("documents nothing the package does not export", () => {
    expect(documented.filter((name) => !exported.includes(name))).toEqual([]);
  });

  it("documents each one once", () => {
    expect(documented.filter((name, index) => documented.indexOf(name) !== index)).toEqual([]);
  });
});
