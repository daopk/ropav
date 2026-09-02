import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { readComponentDirs } from "../../scripts/component-dirs.mjs";
import {
  HOST_EXPORTED_MODULES,
  PUBLIC,
  PUBLIC_MODULES,
  readComposableModules,
} from "../../scripts/composable-modules.mjs";

import { barrelStarExports, localName, parseStatements } from "./parse-exports";

/*
 * `src/index.ts` re-exports the composables barrel wholesale, so every line in that barrel is
 * public API. It got there by default rather than by decision, and six modules were missing from it
 * with nothing to say whether that was intent or a typo — one of them left a public prop type
 * unnameable. `scripts/composable-modules.mjs` now states the surface; this holds the code to it.
 */

const rootDir = path.resolve(import.meta.dirname, "../..");
const composablesDir = path.join(rootDir, "src/composables");
const componentsDir = path.join(rootDir, "src/components");

const { missing, modules, privateModules } = readComposableModules(composablesDir);
const { components } = readComponentDirs(componentsDir);

const barrelSource = fs.readFileSync(path.join(composablesDir, "index.ts"), "utf8");
const barrelExports = barrelStarExports(barrelSource);

const readComponentIndex = (name: string) =>
  fs.readFileSync(path.join(componentsDir, name, "index.ts"), "utf8");

/** Every file under `src`, `.vue` included, as [repo-relative path, source]. */
const sourceFiles: [string, string][] = (function walk(dir: string): [string, string][] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) return walk(full);

    return entry.isFile() && /\.(ts|vue)$/.test(entry.name)
      ? [[path.relative(rootDir, full), fs.readFileSync(full, "utf8")] as [string, string]]
      : [];
  });
})(path.join(rootDir, "src"));

/** Which composable modules a component barrel re-exports, and under which names. */
const composableReExports = (name: string): { module: string; specifiers: string[] }[] => {
  const statements = parseStatements(readComponentIndex(name));
  const imported = new Map<string, string>();

  for (const statement of statements) {
    const module = /^\.\.\/\.\.\/composables\/([a-z0-9-]+)$/.exec(statement.source)?.[1];

    if (!module || statement.isExport) continue;

    for (const specifier of statement.specifiers) imported.set(localName(specifier), module);
  }

  const found = new Map<string, string[]>();
  const add = (module: string, specifier: string) =>
    found.set(module, [...(found.get(module) ?? []), specifier]);

  for (const statement of statements.filter((one) => one.isExport)) {
    const module = /^\.\.\/\.\.\/composables\/([a-z0-9-]+)$/.exec(statement.source)?.[1];

    if (module) {
      for (const specifier of statement.specifiers) add(module, specifier);
      continue;
    }

    // A bare `export { … }` re-exports names imported further up the file.
    if (statement.source !== "") continue;

    for (const specifier of statement.specifiers) {
      const via = imported.get(specifier.split(" as ")[0]?.trim() ?? "");

      if (via) add(via, specifier);
    }
  }

  return [...found].map(([module, specifiers]) => ({ module, specifiers }));
};

/** Every name a component barrel exports, by the name a consumer imports. */
const exportedNames = (source: string) =>
  new Set(
    parseStatements(source)
      .filter((statement) => statement.isExport)
      .flatMap((statement) => statement.specifiers.map(localName)),
  );

describe("composable modules", () => {
  it("are classified exactly once", () => {
    expect(PUBLIC_MODULES.filter((name) => name in HOST_EXPORTED_MODULES)).toEqual([]);
  });

  it("are all backed by a file", () => {
    expect(missing).toEqual([]);
  });

  it("name only public components as hosts", () => {
    const hosts = [...new Set(Object.values(HOST_EXPORTED_MODULES).flat())];

    expect(hosts.filter((host) => !components.includes(host))).toEqual([]);
  });

  it("are listed in sorted order", () => {
    expect(PUBLIC_MODULES).toEqual([...PUBLIC_MODULES].sort());
  });

  it("are each used by something outside the barrel", () => {
    /* Siblings inside `composables/` reach each other by bare relative path, not by directory. */
    const isUsedBy = (module: string, file: string, source: string) =>
      file !== "src/composables/index.ts" &&
      (source.includes(`composables/${module}"`) ||
        (file.startsWith("src/composables/") && source.includes(`"./${module}"`)));

    const unused = modules.filter(
      (module) => !sourceFiles.some(([file, source]) => isUsedBy(module, file, source)),
    );

    expect(unused).toEqual([]);
  });
});

describe("composables/index.ts", () => {
  it("exports exactly the public modules", () => {
    expect([...barrelExports].sort()).toEqual([...PUBLIC_MODULES].sort());
  });

  it("stays sorted", () => {
    expect(barrelExports).toEqual([...barrelExports].sort());
  });

  /*
   * The star-export regex is blind to every other kind of statement, so without this a hand-written
   * `export { X } from "./private-module"` would leak past every assertion above.
   */
  it("contains nothing but star exports", () => {
    const lines = barrelSource
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !line.startsWith("//") && !line.startsWith("/*") && !line.startsWith("*"));

    expect(lines.filter((line) => !/^export \* from "\.\/[a-z0-9-]+";$/.test(line))).toEqual([]);
    expect(lines).toHaveLength(barrelExports.length);
  });
});

describe("component barrels", () => {
  it("re-export no composable the manifest has not authorised", () => {
    const unauthorised = components.flatMap((name) =>
      composableReExports(name)
        .filter(({ module }) => {
          if (PUBLIC.has(module)) return false;

          return !(HOST_EXPORTED_MODULES[module] ?? []).includes(name);
        })
        .map(({ module }) => `${name}: ${module}`),
    );

    expect(unauthorised).toEqual([]);
  });

  it("actually re-export every module the manifest routes through them", () => {
    const unhonoured = Object.entries(HOST_EXPORTED_MODULES).flatMap(([module, hosts]) =>
      hosts
        .filter((host) => !composableReExports(host).some((one) => one.module === module))
        .map((host) => `${host}: ${module}`),
    );

    expect(unhonoured).toEqual([]);
  });
});

describe("the composables barrel", () => {
  /*
   * Keeps it a publishing manifest. A `src` file consuming it means narrowing the public surface
   * could break the build for reasons unrelated to the public surface.
   */
  it("is read by src/index.ts alone", () => {
    const readers = sourceFiles
      .filter(([file]) => file !== "src/index.ts")
      .filter(([, source]) => /from "(?:\.{1,2}\/)+composables"|from "@\/composables"/.test(source))
      .map(([file]) => file);

    expect(readers).toEqual([]);
  });
});

describe("public type surface", () => {
  /*
   * A public prop type may name a type from a private composable — `DropdownRootProps.trigger` names
   * `MenuTriggerType`. The component's own barrel then has to export that name, or a consumer can
   * pass the prop and cannot annotate it.
   *
   * Over-approximates: a type imported into a public type source but used only in a non-exported
   * position is still reported. Re-exporting it is harmless, so that is the cheaper error to make.
   * Follows one hop, so a type source importing from another type source is not traced.
   */
  it("names every private composable type a public prop needs", () => {
    const stranded = components.flatMap((name) => {
      const indexSource = readComponentIndex(name);
      const exported = exportedNames(indexSource);

      const typeSources = parseStatements(indexSource)
        .filter((statement) => statement.isExport && /^\.\/[a-z0-9.-]+$/.test(statement.source))
        .map((statement) => statement.source);

      return [...new Set(typeSources)].flatMap((source) => {
        const file = path.join(componentsDir, name, `${source.slice(2)}.ts`);

        if (!fs.existsSync(file)) return [];

        return parseStatements(fs.readFileSync(file, "utf8"))
          .filter((statement) => !statement.isExport)
          .flatMap((statement) => {
            const module = /^\.\.\/\.\.\/composables\/([a-z0-9-]+)$/.exec(statement.source)?.[1];

            if (!module || PUBLIC.has(module)) return [];

            return statement.specifiers
              .map(localName)
              .filter((one) => !exported.has(one))
              .map((one) => `${name}: ${one} (from ${module})`);
          });
      });
    });

    expect(stranded).toEqual([]);
  });
});

describe("public composables", () => {
  /*
   * No exception list, deliberately. This failed for dozens of modules against the old barrel,
   * which is why it ships last: landing it earlier would have meant an allowlist, and an allowlist
   * would have made it decoration. A composable the package calls supported API has a test.
   */
  it("each have a test of their own", () => {
    const suites = new Set(
      fs
        .readdirSync(path.join(rootDir, "tests/composables"))
        .filter((name) => name.endsWith(".test.ts")),
    );

    const untested = PUBLIC_MODULES.filter(
      (module) => !suites.has(`${module}.test.ts`) && !suites.has(`${module}.browser.test.ts`),
    );

    expect(untested).toEqual([]);
  });
});

describe("private composables", () => {
  it("are absent from the barrel", () => {
    expect(privateModules.filter((module) => barrelExports.includes(module))).toEqual([]);
  });
});
