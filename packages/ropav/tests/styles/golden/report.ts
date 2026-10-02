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
 * The custom properties are left out on purpose, under either prefix.
 *
 * `--tw-ring-shadow` and its kin existed only to let one utility compose with the next; they were
 * renamed to `--rp-` and several groups dissolved outright. What matters is the property they
 * compose *into* — the `box-shadow` an element ends up with — and recording the slots as well would
 * make a rename read as two thousand regressions while saying nothing the `box-shadow` line does
 * not already say.
 *
 * The palette wears that same prefix and goes for the same reason: a token is only ever visible
 * through the property that reads it, and that property is recorded.
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

/** How many ids `added` and `removed` name before they count the rest instead. */
const NAMED = 40;

/** How many of the properties that moved `changed` shows a line for. */
const EXAMPLES = 12;

/** Cases one report names and the other does not: how many, and which. */
export interface Unpaired {
  cases: number;
  ids: string[];
}

/**
 * How two reports differ, in a shape that fits in a terminal.
 *
 * `changed` is the signal, and the only part that compares two values: a property that moved on a
 * case both reports name. `added` and `removed` are cases only one of them names, so nothing was
 * compared for those. `README.md` says what to read into each.
 */
export interface Summary {
  added: Unpaired;
  changed: {
    /** Cases with a value that moved, each counted once however many modes it moved in. */
    cases: number;
    /** The first line to move each property, for a dozen properties at most. */
    each: string[];
    /** How many values moved, by property. */
    properties: Record<string, number>;
    /** How many values moved in all, one per property, case and mode. */
    values: number;
  };
  removed: Unpaired;
}

/**
 * The ids in `seen`, each named once rather than once per mode.
 *
 * A case is built the same under every mode, so it appears or vanishes in all of them together and
 * the lines for each mode are one finding. An id missing from only some modes keeps the modes it
 * is in, written the way the lines write them, since that is a different finding.
 */
const named = (seen: Map<string, string[]>, modes: number): Unpaired => {
  const ids = [...seen]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .flatMap(([id, where]) =>
      where.length === modes ? [id] : where.map((mode) => `${mode} ${id}`),
    );
  const rest = ids.length - NAMED;

  return { cases: seen.size, ids: rest > 0 ? [...ids.slice(0, NAMED), `… and ${rest} more`] : ids };
};

/**
 * What the golden fails with: the lines `differences` writes, folded into a `Summary`.
 *
 * Shape first, lines second. A step that moves a thousand values is read by *which properties
 * moved* and *how many cases* — the untruncated list does not fit in a terminal.
 *
 * And one example per property rather than the first ten lines: sorted, the first ten are whatever
 * selector sorts first, which routinely means ten copies of one finding while a second, different
 * one further down goes unread.
 *
 * A case that appeared or vanished is counted apart from the values, because nothing was compared
 * for it. Counted together, a step that added 64 rules and moved nothing read as 256 changes with
 * one example, and only a list of every line could say otherwise. Such a case is named rather
 * than sampled, since which rule came or went is all its line says.
 */
export const summarise = (before: Report, after: Report): Summary => {
  const modes = Object.keys({ ...before, ...after }).length;
  const added = new Map<string, string[]>();
  const removed = new Map<string, string[]>();
  const cases = new Set<string>();
  const properties: Record<string, number> = {};
  const example: Record<string, string> = {};
  let values = 0;

  for (const line of differences(before, after)) {
    const [, mode, sign, id] = /^(\S+) ([+-]) (.+)$/.exec(line) ?? [];

    if (sign) {
      const seen = sign === "+" ? added : removed;

      seen.set(id!, [...(seen.get(id!) ?? []), mode!]);
      continue;
    }
    const [, moved, prop] = /^\S+ (.+?) \| ([\w-]+): /.exec(line)!;

    cases.add(moved!);
    properties[prop!] = (properties[prop!] ?? 0) + 1;
    example[prop!] ??= line;
    values++;
  }

  return {
    added: named(added, modes),
    changed: {
      cases: cases.size,
      each: Object.values(example).slice(0, EXAMPLES),
      properties,
      values,
    },
    removed: named(removed, modes),
  };
};
