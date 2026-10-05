import path from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import { compileCss } from "../../../styles/scripts/bundle-css.mjs";

/**
 * `@ropav/styles` in two halves: `core.css`, everything the component files stand on, and
 * `components.css`, the component files and nothing else.
 *
 * The split exists so an app can take the core with its first paint and the components later, with
 * the code that draws them when it is loaded on demand. Two properties make that safe, and both are
 * pinned here rather than left to the comments that state them:
 *
 * - the halves are the whole entry, rule for rule, in the same layers. A rule that fell between
 *   them would be missing from every app built on the split, silently;
 * - the components half carries nothing outside `@layer components`. A theme in it would arrive
 *   after the app's own `@layer theme` tokens and beat them, and a reset arriving late would
 *   undo whatever the app built on top of the first one.
 *
 * Compared after compilation, by layer, because the source is three lists of `@import`s that say
 * nothing about what lands where, and because the compiler is free to restate the layer order
 * differently in each file. What a page can tell apart is the rules in each layer, in order.
 */

const stylesRoot = path.resolve(import.meta.dirname, "../../../styles");

const UNLAYERED = "(unlayered)";

/**
 * The compiled sheet's top-level rules, by layer: each layer's blocks joined in order, and every
 * unlayered rule under one key. Statements (`@layer a, b;`) only restate an order and are dropped.
 */
const byLayer = (css: string): Record<string, string> => {
  const layers: Record<string, string> = {};
  let depth = 0;
  let start = 0;

  for (let index = 0; index < css.length; index++) {
    const char = css[index];

    if (char === "{") depth++;
    else if (char === ";" && depth === 0) start = index + 1;
    else if (char === "}" && --depth === 0) {
      const block = css.slice(start, index + 1);
      const layer = /^@layer ([\w-]+)\{/.exec(block);
      const key = layer ? layer[1]! : UNLAYERED;
      const body = layer ? block.slice(layer[0].length, -1) : block;

      layers[key] = (layers[key] ?? "") + body;
      start = index + 1;
    }
  }

  return layers;
};

describe("@ropav/styles' core and components halves", () => {
  const sheets: Record<"components" | "core" | "index", Record<string, string>> = {
    components: {},
    core: {},
    index: {},
  };

  beforeAll(async () => {
    for (const name of ["components", "core", "index"] as const) {
      sheets[name] = byLayer(await compileCss(path.join(stylesRoot, `${name}.css`)));
    }
  });

  it("add up to the whole entry, layer by layer", () => {
    const layers = new Set([...Object.keys(sheets.core), ...Object.keys(sheets.components)]);
    const joined = Object.fromEntries(
      [...layers].map((layer) => [
        layer,
        (sheets.core[layer] ?? "") + (sheets.components[layer] ?? ""),
      ]),
    );

    expect(joined).toEqual(sheets.index);
  });

  it("keep every component rule out of the core", () => {
    expect(sheets.core["components"]).toBeUndefined();
  });

  it("keep the components half inside `@layer components`", () => {
    expect(Object.keys(sheets.components)).toEqual(["components"]);
  });
});
