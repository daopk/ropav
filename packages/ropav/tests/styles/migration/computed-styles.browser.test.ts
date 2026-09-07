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

    /*
     * Shape first, lines second. A step that moves a thousand values is read by *which properties
     * moved* and *how many cases* — the untruncated list does not fit in a terminal.
     *
     * And one example per property rather than the first ten lines: sorted, the first ten are
     * whatever selector sorts first, which routinely means ten copies of one finding while a
     * second, different one further down goes unread.
     */
    const properties: Record<string, number> = {};
    const example: Record<string, string> = {};
    const cases = new Set<string>();

    for (const line of lines) {
      cases.add(line.split(" | ")[0]!);

      const prop = /\| ([\w-]+):/.exec(line)?.[1] ?? "(whole rule)";

      properties[prop] = (properties[prop] ?? 0) + 1;
      example[prop] ??= line;
    }

    expect({
      cases: cases.size,
      changed: lines.length,
      each: Object.values(example).slice(0, 12),
      properties,
    }).toEqual({ cases: 0, changed: 0, each: [], properties: {} });
  });
});
