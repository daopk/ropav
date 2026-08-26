import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  BARREL_ONLY_DIRS,
  INTERNAL_DIRS,
  readComponentDirs,
} from "../../scripts/component-dirs.mjs";

/*
 * Three lists decide what a consumer can reach, and nothing used to hold them together: the barrel
 * at `src/components/index.ts` is hand-written, the build entries come from `vite.config.ts`, and
 * the package subpaths come from `scripts/update-exports.mjs`. They drifted — `color-input-group`
 * had a subpath and a build entry but no barrel line, so `ropav/color-input-group` resolved while
 * `import { ColorInputGroup } from "ropav"` returned nothing.
 */

const rootDir = path.resolve(import.meta.dirname, "../..");
const componentsDir = path.join(rootDir, "src/components");

const { components, missingIndex } = readComponentDirs(componentsDir);

const readIndex = (name: string) =>
  fs.readFileSync(path.join(componentsDir, name, "index.ts"), "utf8");

/** `import { … } from "…"`, `export { … } from "…"`, and the bare `export { … }` in between. */
const NAMED_STATEMENT = /(import|export)(\s+type)?\s*\{([^}]*)\}\s*(?:from\s*"([^"]+)")?/g;

interface NamedStatement {
  isExport: boolean;
  isTypeOnly: boolean;
  /** Specifiers as written, so `X as Y` survives for the alias check. */
  specifiers: string[];
  /** Empty for a bare `export { … }`, which re-exports names imported further up the file. */
  source: string;
}

const parseStatements = (source: string): NamedStatement[] =>
  [...source.matchAll(NAMED_STATEMENT)].map((match) => ({
    isExport: match[1] === "export",
    isTypeOnly: Boolean(match[2]),
    source: match[4] ?? "",
    specifiers: (match[3] ?? "")
      .split(",")
      .map((specifier) => specifier.trim())
      .filter(Boolean),
  }));

/** The name a specifier is known by locally: `X as Y` binds `Y`, a bare `X` binds `X`. */
const localName = (specifier: string) => specifier.split(" as ").at(-1)?.trim() ?? specifier;

/** The `export * from "./name"` lines in the barrel, in the order they appear. */
const barrelExports = [
  ...fs
    .readFileSync(path.join(componentsDir, "index.ts"), "utf8")
    .matchAll(/^export \* from "\.\/([^"]+)";$/gm),
].map((match) => match[1] ?? "");

describe("component directories", () => {
  it("all have an index.ts", () => {
    expect(missingIndex).toEqual([]);
  });

  it("are classified exactly once", () => {
    expect([...INTERNAL_DIRS].filter((name) => BARREL_ONLY_DIRS.has(name))).toEqual([]);
  });

  it("only skip directories that exist", () => {
    const skipped = [...INTERNAL_DIRS, ...BARREL_ONLY_DIRS];

    expect(skipped.filter((name) => !fs.existsSync(path.join(componentsDir, name)))).toEqual([]);
  });
});

describe("components/index.ts", () => {
  it("exports every component that earns a subpath, plus the barrel-only directories", () => {
    expect([...barrelExports].sort()).toEqual([...components, ...BARREL_ONLY_DIRS].sort());
  });

  it("exports nothing internal", () => {
    expect(barrelExports.filter((name) => INTERNAL_DIRS.has(name))).toEqual([]);
  });

  it("stays sorted", () => {
    expect(barrelExports).toEqual([...barrelExports].sort());
  });
});

describe.each([...INTERNAL_DIRS])("internal directory %s", (internal) => {
  const specifier = `../${internal}`;

  /** Components that render any part of this directory, `.vue` files included. */
  const consumers = components.filter((name) =>
    fs
      .readdirSync(path.join(componentsDir, name))
      .some((file) =>
        fs.readFileSync(path.join(componentsDir, name, file), "utf8").includes(`"${specifier}"`),
      ),
  );

  /**
   * What each barrel re-exports out of this directory, either straight through or by way of a
   * local import — every host uses the second form, because it also feeds the compound object.
   */
  const reExportsOf = (name: string) => {
    const statements = parseStatements(readIndex(name));
    const imported = new Set(
      statements
        .filter((statement) => !statement.isExport && statement.source === specifier)
        .flatMap((statement) => statement.specifiers.map(localName)),
    );

    return statements
      .filter((statement) => statement.isExport)
      .flatMap((statement) =>
        statement.source === specifier
          ? statement.specifiers
          : statement.source === ""
            ? statement.specifiers.filter((one) => imported.has(one.split(" as ")[0]?.trim() ?? ""))
            : [],
      );
  };

  /** The barrels that put a part of this directory into their own public API. */
  const hosts = components.filter((name) => reExportsOf(name).length > 0);

  it("is used by something", () => {
    expect(consumers.length).toBeGreaterThan(0);
  });

  it("keeps its own names out of the public API", () => {
    // An alias is the whole point: `X as DateFieldInput` is fine, a bare `X` is the leak.
    const leaked = hosts.flatMap((name) =>
      reExportsOf(name)
        .filter((one) => !one.includes(" as "))
        .map((one) => `${name}: ${one}`),
    );

    expect(leaked).toEqual([]);
  });

  /*
   * A host that hands these parts to consumers has to hand over their prop types too, or the part
   * is a component you can render and cannot annotate. `date-picker` and `date-range-picker`
   * re-exported the parts and left the types behind.
   */
  it("is re-exported with its types wherever it surfaces", () => {
    const withoutTypes = hosts.filter(
      (name) =>
        !parseStatements(readIndex(name)).some(
          (statement) =>
            statement.isExport && statement.isTypeOnly && statement.source === specifier,
        ),
    );

    expect(withoutTypes).toEqual([]);
  });
});
