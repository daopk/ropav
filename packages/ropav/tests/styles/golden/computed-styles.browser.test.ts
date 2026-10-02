import type { Report } from "./report";

import { describe, expect, it } from "vitest";

import { capture, summarise } from "./report";

/**
 * What every rule in the `components` layer resolves to, held against a frozen baseline.
 *
 * See `README.md` for how to freeze one. The baseline is gitignored, so with none present the
 * comparison shows as skipped rather than as a pass — an empty comparison reporting success is
 * worse than no guard at all.
 */

const BASELINE = "./__baseline__/computed-styles.json";

const frozen = import.meta.glob<string>("./__baseline__/computed-styles.json", {
  eager: true,
  import: "default",
  query: "?raw",
});

const baseline = Object.values(frozen)[0];

const freezing = import.meta.env["VITE_FREEZE_STYLES"] === "1";

describe("computed styles", () => {
  it.runIf(freezing)("freeze a baseline", async () => {
    await expect(`${JSON.stringify(capture(document, window), null, 1)}\n`).toMatchFileSnapshot(
      BASELINE,
    );
  });

  it.skipIf(freezing || !baseline)("match the frozen baseline", () => {
    const before = JSON.parse(baseline as string) as Report;

    // A summary rather than the lines; `summarise` says why it takes the shape it does.
    expect(summarise(before, capture(document, window))).toEqual({
      added: { cases: 0, ids: [] },
      changed: { cases: 0, each: [], properties: {}, values: 0 },
      removed: { cases: 0, ids: [] },
    });
  });
});
