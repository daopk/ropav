import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { readComponentDirs, UNSTYLED_DIRS } from "../../scripts/component-dirs.mjs";
import {
  buildStyleEntries,
  readComponentOrder,
  readRenderGraph,
} from "../../scripts/style-entries.mjs";
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

  it("keeps the source entry", () => {
    expect(targets(exports["./styles"])).toEqual(["./dist/styles.css", "./dist/styles.css"]);
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
   * The two halves of the entry, for an app that loads the component rules later than the core.
   * `ropav`'s own split entries are built on these by name, so a missing one is a broken import
   * in every installed copy rather than a missing feature.
   */
  it("offers the entry's two halves", () => {
    expect([targets(exports["./core.css"]), targets(exports["./components.css"])]).toEqual([
      ["./dist/core.css", "./dist/core.css"],
      ["./dist/components.css", "./dist/components.css"],
    ]);
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

/*
 * `ropav/styles/core`, `ropav/styles/components` and `ropav/styles/<name>`: the same rules as
 * `ropav/styles`, cut so an app can load the components it renders first and the rest later.
 *
 * What these pin is the part nobody would notice going wrong. A component entry that left out
 * something its component draws renders that part unstyled in exactly the apps that took the
 * entry instead of the whole sheet; one that carried the core would bring the default theme back
 * over an app's tokens whenever it loaded late. Neither throws.
 */
describe("ropav split style entries", () => {
  const componentsDir = path.join(ropavRoot, "src/components");
  const { components } = readComponentDirs(componentsDir);
  const graph = readRenderGraph(componentsDir) as Map<string, string[]>;
  const order = readComponentOrder(
    fs.readFileSync(path.join(stylesRoot, "components/index.css"), "utf8"),
  ) as string[];
  const entries = buildStyleEntries({ components, graph, order }) as Record<string, string>;
  const exports = buildExports(components) as Record<string, unknown>;

  /** The component files an entry imports, in its order. */
  const filesOf = (css: string) =>
    [...css.matchAll(/@ropav\/styles\/components\/([a-z0-9-]+)\.css/g)].map(([, name]) => name);

  const dirs = fs
    .readdirSync(componentsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  it("finds a stylesheet for every directory not listed as unstyled", () => {
    const styled = new Set(order);

    expect(dirs.filter((dir) => !styled.has(dir) && !UNSTYLED_DIRS.has(dir))).toEqual([]);
    expect([...UNSTYLED_DIRS].filter((dir) => styled.has(dir) || !dirs.includes(dir))).toEqual([]);
  });

  it("reads what a component draws, and not the contexts it reads", () => {
    expect(graph.get("modal")).toContain("close-button");
    expect(graph.get("sidebar")).toContain("drawer");
    expect(graph.get("dropdown")).toContain("menu");
    // `useButtonGroupContext` and `useFieldsetContext` are imports, but nothing drawn.
    expect(graph.get("button")).toEqual([]);
  });

  it("offers an entry for every styled component, and the core and components halves", () => {
    const styled = components.filter((name) => !UNSTYLED_DIRS.has(name));

    expect(Object.keys(entries).sort()).toEqual(
      ["components.css", "core.css", ...styled.map((name) => `${name}.css`)].sort(),
    );
    expect(
      Object.keys(exports)
        .filter((subpath) => subpath.startsWith("./styles/") && subpath !== "./styles/bundled.css")
        .map((subpath) => `${subpath.slice("./styles/".length)}.css`)
        .sort(),
    ).toEqual(Object.keys(entries).sort());
  });

  it("lists each entry's files in the order the full sheet has them", () => {
    const disordered = Object.entries(entries).filter(([, css]) => {
      const files = filesOf(css);

      return files.join() !== order.filter((name) => files.includes(name)).join();
    });

    expect(disordered.map(([file]) => file)).toEqual([]);
  });

  it("carries what a component draws along with its own file", () => {
    expect(filesOf(entries["modal.css"]!)).toEqual(["close-button", "modal"]);
    expect(filesOf(entries["sidebar.css"]!)).toContain("drawer");
  });

  it("opens every component entry with the layer order, and keeps the core out of all of them", () => {
    const components_ = Object.entries(entries).filter(
      ([file]) => file !== "core.css" && file !== "components.css",
    );

    expect(
      components_
        .filter(
          ([, css]) =>
            !css.split("\n")[1]!.startsWith("@layer theme, base, components, utilities;"),
        )
        .map(([file]) => file),
    ).toEqual([]);
    expect(
      components_
        .filter(([, css]) => /core\.css|themes\/|@ropav\/styles"|index\.css/.test(css))
        .map(([file]) => file),
    ).toEqual([]);
    expect(entries["components.css"]).not.toMatch(/core\.css|themes\//);
  });

  it("brings the override block wherever `button-group` goes, and into the components half", () => {
    const carrying = Object.entries(entries)
      .filter(([, css]) => css.includes("styles-overrides.css"))
      .map(([file]) => file);
    const withGroup = Object.entries(entries)
      .filter(([, css]) => filesOf(css).includes("button-group"))
      .map(([file]) => file);

    expect(carrying.sort()).toEqual([...withGroup, "components.css"].sort());
  });
});
