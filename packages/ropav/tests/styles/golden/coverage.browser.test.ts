import { expect, it } from "vitest";

import { componentCases } from "./cases";
import { RENAMED } from "./renamed";
import { mount } from "./render";
import { firstSatisfiable, parseComplex, splitTopLevel } from "./selector-dom";

/**
 * How much of the `components` layer the snapshot reaches, and whether it is still keying rules
 * the way the baseline was keyed.
 *
 * The guard on the guard. A snapshot is only worth what it covers, and coverage is the one thing
 * that can fall silently: a parser gap drops cases, the remaining ones still match their baseline,
 * and the suite stays green over a shrinking matrix. So the residue is counted, and named.
 *
 * `renamed.ts` can fall the same way. It is a table of strings matched against a sheet, and an
 * entry that matches nothing does nothing — the rule it was written for goes back to being a
 * death and a birth in the report, which reads as noise a report this size produces plenty of.
 * So the table is held against the sheet here, both ways round.
 *
 * What is left out, and why nothing here can reach it:
 *
 * - **interaction-only** — a rule whose every alternative needs `:hover`, `:focus` or `:active`,
 *   with no `[data-hovered]` twin beside it. Markup cannot hold those states; only a pointer or
 *   the debugger protocol can.
 * - **built-but-unmatched** — `:has(+ td > …)`, `::view-transition-new()`, and `:is()` chains
 *   whose ancestor half cannot be hoisted. Rare shapes, each of them one rule.
 * - **unparsed** — `-webkit-autofill`, which is a user-agent state.
 */

/** Cases the synthesiser reached when this was written. Raise it; do not lower it quietly. */
const FLOOR = 0.96;

it("reaches the component layer", () => {
  const cases = componentCases(document.styleSheets);
  const missed = cases.filter((item) => !firstSatisfiable(item.selector, document));

  const reason = (selector: string) => {
    const parts = splitTopLevel(selector, ",");
    const pseudo = /:(hover|active|focus|focus-visible|focus-within|placeholder-shown|open)\b/;

    if (parts.every((part) => pseudo.test(part))) return "interaction-only";
    if (parts.every((part) => !parseComplex(part))) return "unparsed";

    return "built-but-unmatched";
  };

  const byReason: Record<string, number> = {};

  for (const item of missed) {
    const key = reason(item.selector);

    byReason[key] = (byReason[key] ?? 0) + 1;
  }

  const reached = (cases.length - missed.length) / cases.length;

  /*
   * A floor, not a count. The layer shrinks — moving the reduced-motion gate onto an inherited
   * property took 425 rules out of it in one step — so this only has to catch the matrix
   * collapsing, which is what a broken reader looks like.
   */
  expect(cases.length, "the layer is being read at all").toBeGreaterThan(1500);
  expect(reached, `residue ${JSON.stringify(byReason)}`).toBeGreaterThanOrEqual(FLOOR);
});

it("says was renamed only what the sheet still declares", () => {
  // The unaliased view, or a collision below reads as a dead key here: the case a collision
  // costs is the one whose selector this is looking for.
  const declared = new Set(
    componentCases(document.styleSheets, "components", {}).map((item) => item.selector),
  );
  const dead = Object.keys(RENAMED).filter((selector) => !declared.has(selector));

  /*
   * A key is matched against CSSOM, not against the file, and the two disagree about spelling —
   * quoting inside `[]` most of all. A key that survived the rename it describes and then went
   * stale looks identical to one that never matched, and neither says so on its own.
   */
  expect(dead, "renamed.ts names selectors no rule in the layer declares").toEqual([]);
});

it("renames one rule onto another's id never, since the second would be the one that vanishes", () => {
  // `componentCases` keeps the first case per id, so a collision costs a case rather than raising.
  expect(componentCases(document.styleSheets).length).toBe(
    componentCases(document.styleSheets, "components", {}).length,
  );
});

it("keys a renamed rule by the name it used to have, and builds the element it still matches", () => {
  const doc = mount("@layer components { .rp-probe[data-tone='soft'] { color: red } }");

  // Single-quoted in the sheet, double-quoted in the table: the table is written in CSSOM's
  // spelling, which is the half of this that cannot be read off the file.
  const cases = componentCases(doc.styleSheets, "components", {
    '.rp-probe[data-tone="soft"]': ".rp-probe--soft",
  });

  doc.defaultView!.frameElement!.remove();

  expect(cases).toEqual([
    { conditions: [], id: ".rp-probe--soft", selector: '.rp-probe[data-tone="soft"]' },
  ]);
});
