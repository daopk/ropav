/**
 * The frozen report a run is compared against, and the summary of how two of them differ.
 *
 * Kept apart from the test so the shape is stated once: a report is `mode -> case id -> property
 * -> computed value`, and a difference is a line naming all four.
 */

import type { Mode } from "./render";

import { componentCases } from "./cases";
import { declaredProperties, MODES, renderAll, styleDelta } from "./render";

export type Report = Record<string, Record<string, Record<string, string>>>;

/**
 * The composition slots are left out on purpose, under either name.
 *
 * `--tw-ring-shadow` and its kin existed only to let one utility compose with the next; they were
 * renamed to `--rp-` and several groups dissolved outright. What matters is the property they
 * compose *into* — the `box-shadow` an element ends up with — and recording the slots as well would
 * make a rename read as two thousand regressions while saying nothing the `box-shadow` line does
 * not already say.
 *
 * Every token this package means as a token is unprefixed (`--accent`, `--field-border`), so a
 * prefixed name is machinery by construction.
 */
const recorded = (sheets: StyleSheetList) =>
  declaredProperties(sheets).filter((prop) => !/^--(?:tw|rp)-/.test(prop));

/** Renders every case under every mode and reads back what the browser resolved. */
export const capture = (doc: Document, view: Window): Report => {
  const cases = componentCases(doc.styleSheets);
  const properties = recorded(doc.styleSheets);
  const modes = Object.keys(MODES) as Mode[];
  const { host, rendered } = renderAll(cases, modes, doc);

  /*
   * An animation in flight reports the value it is passing through, so a spinner would snapshot a
   * different `rotate` on every run. Pausing at the start reads the state the rules describe.
   */
  for (const animation of doc.getAnimations()) {
    animation.pause();
    animation.currentTime = 0;
  }

  const report: Report = {};

  for (const mode of modes) {
    report[mode] = {};
    for (const [id, entry] of rendered.get(mode)!) {
      report[mode]![id] = styleDelta(entry, properties, view);
    }
  }
  host.remove();

  return report;
};

/** One line per property that moved, plus the cases that appeared or vanished entirely. */
export const differences = (before: Report, after: Report): string[] => {
  const lines: string[] = [];

  for (const mode of Object.keys({ ...before, ...after }).sort()) {
    const was = before[mode] ?? {};
    const now = after[mode] ?? {};

    for (const id of new Set([...Object.keys(was), ...Object.keys(now)]).values()) {
      if (!(id in was)) {
        lines.push(`${mode} + ${id}`);
        continue;
      }
      if (!(id in now)) {
        lines.push(`${mode} - ${id}`);
        continue;
      }
      const properties = new Set([...Object.keys(was[id]!), ...Object.keys(now[id]!)]);

      for (const prop of [...properties].sort()) {
        const from = was[id]![prop] ?? "(unset)";
        const to = now[id]![prop] ?? "(unset)";

        if (from !== to) lines.push(`${mode} ${id} | ${prop}: ${from} -> ${to}`);
      }
    }
  }

  return lines.sort();
};
