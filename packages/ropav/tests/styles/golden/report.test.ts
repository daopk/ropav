import type { Report } from "./report";

import { describe, expect, it } from "vitest";

import { summarise } from "./report";

/**
 * The summary the golden fails with, which is the part of it anyone reads.
 *
 * The golden only compares on a machine that froze a baseline, so nothing else would notice the
 * summary folding two findings into one, or dropping what it was meant to name.
 */

/** The same cases under each of the four modes, as `capture` reports them. */
const everyMode = (cases: Report[string]): Report => ({
  dark: cases,
  "dark-reduced": cases,
  light: cases,
  reduced: cases,
});

const NOTHING = { cases: 0, ids: [] };

describe("summarise", () => {
  it("counts the cases that came and went apart from the values that moved", () => {
    const before = everyMode({ ".kept": { color: "red" }, ".old": { color: "red" } });
    const after = everyMode({ ".kept": { color: "blue" }, ".new": { color: "red" } });

    expect(summarise(before, after)).toEqual({
      added: { cases: 1, ids: [".new"] },
      changed: {
        cases: 1,
        each: ["dark .kept | color: red -> blue"],
        properties: { color: 4 },
        values: 4,
      },
      removed: { cases: 1, ids: [".old"] },
    });
  });

  it("names an id once, or once per mode it is in when some modes lack it", () => {
    const before = everyMode({});
    const after = { ...everyMode({ ".all": {} }), light: { ".all": {}, ".some": {} } };

    expect(summarise(before, after).added).toEqual({ cases: 2, ids: [".all", "light .some"] });
  });

  it("names forty ids and counts the rest", () => {
    const ids = Array.from({ length: 64 }, (_, index) => `.rule-${String(index).padStart(2, "0")}`);
    const { added, removed } = summarise(
      everyMode({}),
      everyMode(Object.fromEntries(ids.map((id) => [id, {}]))),
    );

    expect(added).toEqual({ cases: 64, ids: [...ids.slice(0, 40), "… and 24 more"] });
    expect(removed).toEqual(NOTHING);
  });
});
