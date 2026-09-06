import { expect, it } from "vitest";

import { componentCases } from "./cases";
import { firstSatisfiable, parseComplex, splitTopLevel } from "./selector-dom";

/**
 * How much of the `components` layer the snapshot reaches.
 *
 * The guard on the guard. A snapshot is only worth what it covers, and coverage is the one thing
 * that can fall silently: a parser gap drops cases, the remaining ones still match their baseline,
 * and the suite stays green over a shrinking matrix. So the residue is counted, and named.
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

  expect(cases.length, "the layer is being read at all").toBeGreaterThan(1900);
  expect(reached, `residue ${JSON.stringify(byReason)}`).toBeGreaterThanOrEqual(FLOOR);
});
