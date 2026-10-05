import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The layer order, which is a contract with the app rather than an internal detail.
 *
 * A consumer that declares layers of its own has to name these four, in this order, before its
 * own — otherwise its `app` layer lands between `components` and `utilities`, or the two swap and
 * a utility passed through `class` stops beating the component rule it is correcting. An app that
 * declares its own layers copies this line verbatim into its entry, so reordering or renaming here
 * breaks it silently: what shows up is a layout that is subtly wrong rather than an error.
 *
 * It has to be the first statement, too: `@layer` establishes order at first mention, so a later
 * one cannot reorder what an `@import` above it already introduced.
 */

const ENTRIES = {
  "@ropav/styles": "../../../styles/index.css",
  // The two halves of the entry above. Either can be the first stylesheet a page meets — an app
  // that loads the components later still might list them first — so each carries the order.
  "@ropav/styles/components.css": "../../../styles/components.css",
  "@ropav/styles/core.css": "../../../styles/core.css",
  ropav: "../../src/styles.css",
};

const ORDER = "@layer theme, base, components, utilities;";

/** The first thing that is neither blank nor a comment. */
const firstStatement = (css: string) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

describe("the published entries", () => {
  it("open by declaring the layers in the order the components are written against", () => {
    const opening = Object.fromEntries(
      Object.entries(ENTRIES).map(([name, file]) => [
        name,
        firstStatement(readFileSync(path.resolve(import.meta.dirname, file), "utf8")),
      ]),
    );

    expect(opening).toEqual({
      "@ropav/styles": ORDER,
      "@ropav/styles/components.css": ORDER,
      "@ropav/styles/core.css": ORDER,
      // Its own first statement is the import of the one above, which carries the order.
      ropav: '@import "@ropav/styles";',
    });
  });
});
