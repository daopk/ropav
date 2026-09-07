import { describe, expect, it } from "vitest";

import { componentCases } from "./cases";
import { declaredProperties, mount, renderAll } from "./render";

import source from "@/styles.css?inline";

/**
 * The compiled stylesheet renders what the source says.
 *
 * `dist/ropav.min.css` is the file an app with no build step loads, and it is not the source: a
 * compiler follows the `@import` graph, lowers what the browser floor does not have and rewrites
 * selectors on the way. Nesting is flattened, `:is()` is expanded, rules are merged. Each of
 * those is a chance for the artifact to disagree with the file it was made from, and the
 * disagreement would be silent — the source is what everyone reads and the artifact is what
 * most people load.
 *
 * This mounts both in documents of their own, builds the same DOM in each from the source's own
 * rules, and compares computed styles. It is the check that the compiler is a compiler.
 *
 * The bundle only exists after a build, so this skips without one rather than making `pnpm test`
 * depend on `pnpm build`.
 */

const built = import.meta.glob("../../../dist/ropav.min.css", {
  eager: true,
  import: "default",
  query: "?raw",
});

const compiled = Object.values(built)[0] as string | undefined;

/**
 * A number and its unit, or a word. `33.3333%` and `-0.5px` both split cleanly; so does `solid`.
 */
const TOKEN = /(-?\d*\.?\d+)([a-z%]*)|[^\s,]+/gi;

/** Chromium's layout resolution, plus the rounding in the three decimals it prints. */
const INDISTINGUISHABLE = 1 / 64 + 0.0005;

/**
 * Whether two computed values say the same thing about the page.
 *
 * Not string equality, because a minifier is allowed two liberties that a browser cannot tell
 * apart from the original:
 *
 * `calc(1 / 3 * 100%)` is folded to `33.3333%`, whatever spelling it started from. The arithmetic
 * error in that is a ten-thousandth of a pixel; what shows up is the quantisation underneath it,
 * because a third of 720px is a whole number and 33.3333% of it is not, so the two land in
 * different sixty-fourths. One LayoutUnit is Chromium's own resolution — the smallest difference
 * the engine can represent, and therefore the smallest one it can render.
 *
 * And a zero offset is written in whichever unit is shortest: `0%` becomes `0`, which Chromium
 * reports back as `0px`. Zero of anything is the same place.
 *
 * Everything else has to match exactly — a colour, a keyword, a length that actually moved.
 */
const equivalent = (one: string, two: string): boolean => {
  if (one === two) return true;

  const left = [...one.matchAll(TOKEN)];
  const right = [...two.matchAll(TOKEN)];

  if (left.length !== right.length) return false;

  return left.every((token, index) => {
    const other = right[index]!;

    if (token[1] === undefined || other[1] === undefined) return token[0] === other[0];

    const a = Number(token[1]);
    const b = Number(other[1]);

    if (a === 0 && b === 0) return true;

    return token[2] === other[2] && Math.abs(a - b) <= INDISTINGUISHABLE;
  });
};

describe.skipIf(!compiled)("the compiled stylesheet", () => {
  it("renders every component rule the same as the source it was built from", () => {
    const sourceDoc = mount(source);
    const compiledDoc = mount(compiled!);

    const cases = componentCases(sourceDoc.styleSheets);
    const properties = [
      ...new Set([
        ...declaredProperties(sourceDoc.styleSheets),
        ...declaredProperties(compiledDoc.styleSheets),
      ]),
    ]
      .filter((property) => !property.startsWith("--"))
      .sort();

    const a = renderAll(cases, ["light", "dark"], sourceDoc);
    const b = renderAll(cases, ["light", "dark"], compiledDoc);

    const differing = new Map<string, number>();
    const example = new Map<string, string>();
    let compared = 0;

    for (const mode of ["light", "dark"] as const) {
      for (const [id, left] of a.rendered.get(mode)!) {
        const right = b.rendered.get(mode)!.get(id);

        if (!right) continue;
        compared++;

        const one = sourceDoc.defaultView!.getComputedStyle(left.target, left.pseudoElement);
        const two = compiledDoc.defaultView!.getComputedStyle(right.target, right.pseudoElement);

        for (const property of properties) {
          const from = one.getPropertyValue(property);
          const to = two.getPropertyValue(property);

          if (equivalent(from, to)) continue;

          differing.set(property, (differing.get(property) ?? 0) + 1);
          if (!example.has(property)) {
            example.set(property, `${mode} ${id.slice(0, 70)} | ${from} -> ${to}`);
          }
        }
      }
    }

    a.host.remove();
    b.host.remove();

    const ranked = [...differing].sort((x, y) => y[1] - x[1]);

    expect({
      differences: Object.fromEntries(ranked),
      // Guards the harness rather than the artifact: an empty report is also what a comparison
      // that built nothing produces.
      ran: compared > 0,
      sample: ranked.slice(0, 8).map(([property]) => `${property}: ${example.get(property)}`),
    }).toEqual({ differences: {}, ran: true, sample: [] });
  });
});
