import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { readComponentDirs } from "../../scripts/component-dirs.mjs";
import { buildExports } from "../../scripts/update-exports.mjs";

/*
 * The compiled stylesheet was unreachable for a release: `dist/ropav.min.css` was built on every
 * run and named by nothing but the legacy `browser` field, which `exports` shadows for every
 * modern resolver. It could be fetched from a CDN by raw path and from nowhere else, and no test
 * noticed, because nothing held the map against what the build actually emits.
 *
 * The disk half of that only means something after a build, so it is skipped without one rather
 * than forcing `pnpm test` to depend on `pnpm build`. The map half always runs.
 */

const ropavRoot = path.resolve(import.meta.dirname, "../..");
const stylesRoot = path.resolve(ropavRoot, "../styles");

const readJson = (file: string) => JSON.parse(fs.readFileSync(file, "utf8"));

/** Every path a condition object or a bare string target names. */
const targets = (entry: unknown): string[] =>
  typeof entry === "string" ? [entry] : Object.values(entry as Record<string, string>);

/**
 * Stylesheets only. The JavaScript half of the map is `exports.test.ts`'s subject, and its `.d.ts`
 * targets exist only under `build --tsc`, which would make this fail on a `build:fast`.
 */
const stylesheetsIn = (exports: Record<string, unknown>) =>
  Object.entries(exports)
    .flatMap(([subpath, entry]) => targets(entry).map((target) => [subpath, target] as const))
    .filter(([, target]) => target.endsWith(".css"));

describe("ropav style subpaths", () => {
  const { components } = readComponentDirs(path.join(ropavRoot, "src/components"));
  const exports = buildExports(components) as Record<string, unknown>;
  const distDir = path.join(ropavRoot, "dist");
  const built = fs.existsSync(path.join(distDir, "ropav.min.css"));

  it("offers the compiled stylesheet, not only the two entries that need a build", () => {
    expect(exports["./styles/bundled.css"]).toBe("./dist/ropav.min.css");
  });

  it("keeps the source entries", () => {
    expect(targets(exports["./styles"])).toEqual(["./dist/styles.css", "./dist/styles.css"]);
    expect(targets(exports["./styles/no-preflight"])).toEqual([
      "./dist/styles-no-preflight.css",
      "./dist/styles-no-preflight.css",
    ]);
  });

  it.skipIf(!built)("names only stylesheets the build emits", () => {
    const missing = stylesheetsIn(exports)
      .filter(([, target]) => !fs.existsSync(path.join(ropavRoot, target)))
      .map(([subpath, target]) => `${subpath} -> ${target}`);

    expect(missing).toEqual([]);
  });
});

describe("@ropav/styles style subpaths", () => {
  const config = readJson(path.join(stylesRoot, "clean-package.config.json"));
  const published = config.replace as Record<string, unknown>;
  const exports = published["exports"] as Record<string, unknown>;
  const distDir = path.join(stylesRoot, "dist");
  const built = fs.existsSync(path.join(distDir, "ropav.min.css"));

  it("offers the compiled stylesheet through a subpath, not only the legacy field", () => {
    expect(exports["./bundled.css"]).toBe("./dist/ropav.min.css");
  });

  /*
   * A CDN ignores `exports` and reads these, which is what makes a bare
   * `<link href="https://cdn.jsdelivr.net/npm/@ropav/styles">` land on the stylesheet.
   */
  it("points every bundled-file field at the same file", () => {
    const named = [published["browser"], published["unpkg"], published["jsdelivr"]];

    expect(named).toEqual(Array(named.length).fill(exports["./bundled.css"]));
  });

  it.skipIf(!built)("names only stylesheets the build emits", () => {
    const missing = stylesheetsIn(exports)
      // A pattern subpath stands for a directory the build fills; the literals are the contract.
      .filter(([subpath]) => !subpath.includes("*"))
      .filter(([, target]) => !fs.existsSync(path.join(stylesRoot, target)))
      .map(([subpath, target]) => `${subpath} -> ${target}`);

    expect(missing).toEqual([]);
  });

  /*
   * The map in `package.json` and the one `clean-package` swaps in at publish are two lists, and
   * only the second one ships. A subpath added to the first alone resolves all the way through
   * development and through every test that reads the repo, and is simply absent from the
   * installed package — the same shape of failure as the entry that pointed at a file the build
   * never emitted, arriving from the other direction.
   *
   * Only one way round: the published map carries extra granular subpaths on purpose, because the
   * directories behind them exist only in the tarball.
   */
  it("publishes every subpath the source map offers", () => {
    const source = readJson(path.join(stylesRoot, "package.json")).exports as Record<
      string,
      unknown
    >;
    const dropped = Object.keys(source).filter((subpath) => !(subpath in exports));

    expect(dropped).toEqual([]);
  });
});
