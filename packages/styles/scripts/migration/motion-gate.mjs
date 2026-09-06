/**
 * Moves the reduced-motion gate off the selectors and onto the declarations.
 *
 *   node scripts/migration/motion-gate.mjs [--dry]
 *
 * Two edits, both byte-spliced so the comment layer survives:
 *
 * 1. Every declaration that animates leads with `var(--rp-motion)`. Durations and the two
 *    shorthands only — gating `transition-property` instead would be a trap, because a
 *    `transition-property` knocked out to its initial value is `all`, and `all` beside a duration
 *    nothing gated transitions *more* than before, not less.
 * 2. Every gate the variant used to compile to is deleted. Only the two suppressive shapes —
 *    `transition-property: none` and `animation: none`. A gate that sets a value rather than
 *    removing one is saying something the property cannot say, and is left where it is.
 *
 * See `motion.css` for why the property replaces the selectors at all.
 */
/* eslint-disable no-console */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import postcss from "postcss";

import { stylesheets, stylesRoot } from "./corpus.mjs";

const GATED = /^(transition|animation|transition-duration|animation-duration)$/;

const EXPLICIT = /^&:is\(\[data-reduce-motion="true"\], \[data-reduce-motion="true"\] \*\)$/;
const FALLBACK =
  /^&:not\(:is\(\[data-reduce-motion="true"\], \[data-reduce-motion="true"\] \*\)\)$/;

/** A gate body that only removes motion, and so has an equivalent in the property. */
const SUPPRESSIVE = /^\{\s*(transition-property: none|animation: none);/;

const oneLine = (text) => text.replace(/\s+/g, " ").trim();

/**
 * The node's byte range, widened to the whole lines it sits on.
 *
 * `end.offset` is already one past the closing brace, so it must not be advanced again: the next
 * character is the newline, and stepping over it sends the scan looking for the *following* line
 * ending. For two adjacent gates that means the first one's range swallows the second's opening
 * line, and the splice lands mid-token several declarations further on.
 */
const lineRange = (source, node) => {
  const start = source.lastIndexOf("\n", node.source.start.offset) + 1;
  let end = node.source.end.offset;

  while (end < source.length && source[end] !== "\n") end++;

  return { end: end + 1, start };
};

const rewriteFile = (file) => {
  const source = readFileSync(file, "utf8");
  const root = postcss.parse(source);
  const edits = [];
  let gates = 0;
  let gated = 0;

  root.walkRules((rule) => {
    const selector = oneLine(rule.selector);

    if (!EXPLICIT.test(selector) && !FALLBACK.test(selector)) return;
    if (!SUPPRESSIVE.test(oneLine(rule.toString().slice(rule.selector.length)))) return;

    // The fallback half is wrapped in its own `@media`, which goes with it.
    const remove = FALLBACK.test(selector) ? rule.parent : rule;

    edits.push({ ...lineRange(source, remove), replacement: "" });
    gates++;
  });

  root.walkDecls((decl) => {
    if (!GATED.test(decl.prop)) return;
    if (decl.value.includes("--rp-motion")) return;
    // A gate's own body is about to be deleted; do not gate what is on its way out.
    if (
      edits.some(
        (edit) => decl.source.start.offset >= edit.start && decl.source.end.offset < edit.end,
      )
    )
      return;

    const colon = source.indexOf(":", decl.source.start.offset);

    edits.push({ end: colon + 1, replacement: ": var(--rp-motion)", start: colon });
    gated++;
  });

  let out = source;
  const ordered = edits.sort((a, b) => b.start - a.start);

  // Back to front, so earlier offsets stay valid — which only holds if no two ranges overlap.
  for (const [index, edit] of ordered.entries()) {
    const next = ordered[index + 1];

    if (next && next.end > edit.start) {
      throw new Error(
        `${path.basename(file)}: overlapping ranges at ${next.start} and ${edit.start}`,
      );
    }
    out = out.slice(0, edit.start) + edit.replacement + out.slice(edit.end);
  }

  return { css: out, gated, gates };
};

const dry = process.argv.includes("--dry");
let gates = 0;
let gated = 0;
let touched = 0;

for (const file of stylesheets().filter((f) => f.includes(`${path.sep}components${path.sep}`))) {
  const result = rewriteFile(file);

  if (result.gates === 0 && result.gated === 0) continue;
  if (!dry) writeFileSync(file, result.css);
  gates += result.gates;
  gated += result.gated;
  touched++;
}

console.log(
  `${dry ? "Would remove" : "Removed"} ${gates} gate blocks and ${dry ? "gate" : "gated"} ${gated} declarations across ${touched} files.`,
);
console.log(`Root: ${stylesRoot}`);
