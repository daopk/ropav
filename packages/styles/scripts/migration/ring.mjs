/**
 * Collapses the five-slot `box-shadow` composite to two slots.
 *
 * ```bash
 * node scripts/migration/ring.mjs --files=components/button.css   # one file
 * node scripts/migration/ring.mjs                                 # all of them
 * node scripts/migration/ring.mjs --dry                           # and put them back
 * ```
 *
 * A ring is two shadows: a smaller one in the page's colour that paints the gap, and a larger one
 * in the ring's colour behind it. Five slots carried them because independently-authored utilities
 * had to combine without knowing about each other — `ring-2` cannot see `ring-offset-4`, so each
 * wrote its own slot and a shared `box-shadow` read all of them. A rule that spells its own
 * declarations has no such problem, and two of the five slots are never written at all.
 *
 * What this does *not* do is fold the parameters away. `--rp-ring-offset-width`,
 * `--rp-ring-offset-color`, `--rp-ring-color` and `--rp-ring-inset` are how one rule
 * re-parameterises a ring another rule composed: `.rp-toggle-button-group .rp-toggle-button` sets
 * the offset to zero and the ring to inset, and the composite it is adjusting lives in
 * `toggle-button.css`. Writing the ring as a literal would drop that override silently, in a
 * state nobody photographs.
 *
 * The initial value is a *pair* of no-op shadows rather than one, and that is load-bearing.
 * Chromium pairs shadow lists positionally and pads the shorter one at the end, so a list that
 * grows from two entries to three during a transition pairs the drop shadow with the ring and
 * produces a blend of the two. Holding the ring's two slots open keeps the list the same length
 * in both states, which is what the five-slot form did by accident. No golden reads a midpoint,
 * so nothing here would have caught it.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import postcss from "postcss";

const stylesRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const norm = (s) => s.replace(/\s+/g, " ").trim();

/**
 * The three forms this step recognises, whitespace aside. Anything else is a shape the survey
 * did not see, and guessing at it is how a ring goes missing in one state of one component.
 */
const RING_EXPR = norm(`var(--rp-ring-inset,) 0 0 0 calc(2px + var(--rp-ring-offset-width))
  var(--rp-ring-color, currentcolor)`);
const OFFSET_EXPR = norm(`var(--rp-ring-inset,) 0 0 0 var(--rp-ring-offset-width)
  var(--rp-ring-offset-color)`);
const COMPOSITE_EXPR = norm(`var(--rp-inset-shadow), var(--rp-inset-ring-shadow),
  var(--rp-ring-offset-shadow), var(--rp-ring-shadow), var(--rp-shadow)`);

/** Offset first: an earlier shadow paints over a later one, and the gap belongs on top. */
const MERGED_RING = `--rp-ring: ${OFFSET_EXPR}, ${RING_EXPR};`;
const MERGED_COMPOSITE = "box-shadow: var(--rp-ring), var(--rp-shadow);";

/**
 * The span to cut for a declaration that owns its lines: back over the indentation, forward past
 * the semicolon and the newline. Values here contain no semicolon of their own, so scanning for
 * the first one is exact.
 */
const lineSpan = (css, decl) => {
  const start = decl.source.start.offset;
  let end = css.indexOf(";", start);

  if (end === -1) throw new Error(`unterminated declaration: ${decl.prop}`);
  end += 1;

  const lineStart = css.lastIndexOf("\n", start) + 1;
  const ownsLine = css.slice(lineStart, start).trim() === "";

  if (css[end] === "\n") end += 1;

  return { end, indent: css.slice(lineStart, start), start: ownsLine ? lineStart : start };
};

const files =
  process.argv
    .find((a) => a.startsWith("--files="))
    ?.slice("--files=".length)
    .split(",") ??
  readdirSync(path.join(stylesRoot, "components"))
    .filter((f) => f.endsWith(".css"))
    .map((f) => `components/${f}`);

const dry = process.argv.includes("--dry");
const counts = { composite: 0, dropped: 0, duplicates: 0, files: 0, merged: 0 };

for (const rel of files) {
  const abs = path.join(stylesRoot, rel);
  const css = readFileSync(abs, "utf8");
  /** Splices are collected with absolute offsets and applied last-first, so none shifts another. */
  const splices = [];

  postcss.parse(css, { from: rel }).walkRules((rule) => {
    const decls = rule.nodes.filter((n) => n.type === "decl");

    const ring = decls.filter((d) => d.prop === "--rp-ring-shadow");
    const offset = decls.filter((d) => d.prop === "--rp-ring-offset-shadow");
    const composite = decls.filter(
      (d) => d.prop === "box-shadow" && norm(d.value) === COMPOSITE_EXPR,
    );
    const widths = decls.filter((d) => d.prop === "--rp-ring-offset-width");

    for (const d of [...ring, ...offset]) {
      const expected = d.prop === "--rp-ring-shadow" ? RING_EXPR : OFFSET_EXPR;

      if (norm(d.value) !== expected) {
        throw new Error(`${rel}:${d.source.start.line} unrecognised ${d.prop}: ${norm(d.value)}`);
      }
    }
    if (ring.length !== offset.length) {
      throw new Error(`${rel}:${rule.source.start.line} ring and offset slots do not pair up`);
    }

    /* The pair becomes one declaration where the ring slot stood; the offset slot's line goes. */
    for (const [i, d] of ring.entries()) {
      const span = lineSpan(css, d);

      splices.push({ ...span, text: `${span.indent}${MERGED_RING}\n` });
      counts.merged += 1;
      const o = lineSpan(css, offset[i]);

      splices.push({ ...o, text: "" });
      counts.dropped += 1;
    }

    for (const d of composite) {
      const span = lineSpan(css, d);

      splices.push({ ...span, text: `${span.indent}${MERGED_COMPOSITE}\n` });
      counts.composite += 1;
    }

    /* A parameter written twice in one rule has one live declaration: custom properties resolve
     * after the cascade, so only the last one is ever read. The earlier is an artefact of two
     * utilities having been expanded in sequence. */
    for (const d of widths.slice(0, -1)) {
      splices.push({ ...lineSpan(css, d), text: "" });
      counts.duplicates += 1;
    }
  });

  if (splices.length === 0) continue;
  counts.files += 1;

  splices.sort((a, b) => b.start - a.start);
  let out = css;

  for (const s of splices) out = out.slice(0, s.start) + s.text + out.slice(s.end);
  if (!dry) writeFileSync(abs, out);
}
