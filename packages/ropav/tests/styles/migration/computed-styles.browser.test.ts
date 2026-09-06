import type { Report } from "./report";

import { describe, expect, it } from "vitest";

import { capture, differences } from "./report";

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
    const lines = differences(before, capture(document, window));

    // Truncated: a step that moves a thousand cases is answered by the first few, and the rest
    // would push them out of the terminal. The count says how much is behind them.
    expect({ changed: lines.length, first: lines.slice(0, 30) }).toEqual({ changed: 0, first: [] });
  });
});
