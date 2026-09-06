/**
 * Moves the animations off a third-party library's keyframes and onto the package's own.
 *
 *   node scripts/migration/animations.mjs
 *
 * Three edits, all mechanical:
 *
 * 1. **The name.** `enter` and `exit` are document-global and unprefixed, which is how they could
 *    belong to someone else in the first place. They become `rp-enter` and `rp-exit`, and the two
 *    keyframes that came from Tailwind's theme — the spinner's rotation and the skeleton's pulse —
 *    move with them for the same reason.
 *
 * 2. **The shorthand.** Each call site reads seven `var()`s to arrive at four values. Five of
 *    those slots are written nowhere in this package: they are the library's authoring API, read
 *    here only so that a utility class could reach in. Leaving a longhand out of the shorthand
 *    resets it to exactly the initial value those `var()`s were falling back to, so what remains
 *    is the duration and the easing, which are the two the rules actually set.
 *
 * 3. **The slots.** `--tw-enter-*`, `--tw-exit-*`, `--tw-duration` and `--tw-ease` become
 *    `--rp-*`. Both ends move together — the write in the component and the read in the keyframe.
 *
 * And one thing that is not the library's doing, done here because it is the same lines: the
 * expansion left each of these slots written twice, a percentage form followed by the number it
 * means. The number wins, so the pair is dead weight; where no number followed, the percentage
 * becomes one, because a percentage inside `scale3d()` wants a newer transform spec than the rest
 * of the browser floor does.
 */
/* eslint-disable no-console */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import postcss from "postcss";

import { stylesheets, stylesRoot } from "./corpus.mjs";

/** The slots whose two ends both live in this package once the library is gone. */
const SLOTS = [
  "enter-opacity",
  "enter-scale",
  "enter-translate-x",
  "enter-translate-y",
  "exit-opacity",
  "exit-scale",
  "duration",
  "ease",
];

const slotPattern = () => new RegExp(String.raw`--tw-(${SLOTS.join("|")})\b`, "g");

/** Every animation slot, including the five the shorthand reads and nothing writes. */
const anySlot = () => /--tw-(?:animation-[\w-]+|enter-[\w-]+|exit-[\w-]+|duration|ease)\b/g;

/**
 * The shorthand, as the expansion wrote it. Matched as one unit rather than assembled from parts:
 * a partial match would leave a call site half-migrated, running a keyframe that no longer exists
 * under a name that does.
 */
const shorthandPattern = () =>
  /animation:\s*var\(--rp-motion\)\s+(enter|exit)\s+var\(--tw-animation-duration,\s*var\(--tw-duration,\s*0\.15s\)\)\s+var\(--tw-ease,\s*ease\)\s+var\(--tw-animation-delay,\s*0s\)\s+var\(--tw-animation-iteration-count,\s*1\)\s+var\(--tw-animation-direction,\s*normal\)\s+var\(--tw-animation-fill-mode,\s*none\)/g;

const themeKeyframes = () => [
  [/animation:\s*var\(--rp-motion\)\s+spin\b/g, "animation: var(--rp-motion) rp-spin"],
  [
    /animation:\s*var\(--rp-motion\)\s+var\(--animate-pulse\)/g,
    "animation: var(--rp-motion) rp-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  ],
];

/** A scale left as a percentage once its numeric twin has been removed. */
const percentScale = () => /(--rp-(?:enter|exit)-scale):\s*calc\((\d+)\*1%\)/g;

const renamed = new Set(SLOTS.map((slot) => `--rp-${slot}`));

/**
 * The byte range of the whole line a declaration sits on, so removing it takes its indentation and
 * its newline with it. postcss reports an end offset one past the semicolon, so the scan for the
 * newline starts there — stepping over it first runs into the next line and makes two ranges
 * overlap.
 */
const lineRange = (source, decl) => {
  const start = source.lastIndexOf("\n", decl.source.start.offset) + 1;
  let end = decl.source.end.offset;

  while (end < source.length && source[end] !== "\n") end++;

  return { end: end + 1, start };
};

/**
 * Every declaration of a renamed slot that a later one overwrites.
 *
 * Compared only against its own siblings, which is where "the last one wins" holds with nothing
 * else to say about it. A `@media` or `@supports` block is its own group for that reason: the
 * declarations inside it overwrite each other, but not the unconditional one they sit beside —
 * dropping that would change what a browser outside the condition gets.
 */
const overwritten = (css) => {
  const cuts = [];

  const siblings = (container) => {
    const seen = new Map();

    for (const node of container.nodes ?? []) {
      if (node.type !== "decl" || !renamed.has(node.prop)) continue;

      if (seen.has(node.prop)) cuts.push(lineRange(css, seen.get(node.prop)));
      seen.set(node.prop, node);
    }
  };

  const root = postcss.parse(css);

  root.walkRules(siblings);
  root.walkAtRules(siblings);

  return cuts;
};

const splice = (css, ranges) => {
  const ordered = [...ranges].sort((a, b) => a.start - b.start);

  for (const [index, range] of ordered.entries()) {
    const previous = ordered[index - 1];

    if (previous && range.start < previous.end) {
      throw new Error(`Overlapping ranges at ${range.start}: the scan ran past a declaration.`);
    }
  }

  let out = css;

  for (const range of [...ordered].reverse())
    out = out.slice(0, range.start) + out.slice(range.end);

  return out;
};

const counts = { collapsed: 0, keyframes: 0, scales: 0, shorthands: 0, slots: 0 };

const main = () => {
  const files = stylesheets().filter((file) => !file.endsWith(`${path.sep}animations.css`));

  for (const file of files) {
    const original = readFileSync(file, "utf8");
    let css = original;

    css = css.replaceAll(shorthandPattern(), (_, name) => {
      counts.shorthands++;

      return `animation: var(--rp-motion) rp-${name} var(--rp-duration, 0.15s) var(--rp-ease, ease)`;
    });

    for (const [pattern, replacement] of themeKeyframes()) {
      css = css.replaceAll(pattern, () => {
        counts.keyframes++;

        return replacement;
      });
    }

    css = css.replaceAll(slotPattern(), (_, slot) => {
      counts.slots++;

      return `--rp-${slot}`;
    });

    const cuts = overwritten(css);

    counts.collapsed += cuts.length;
    css = splice(css, cuts);

    css = css.replaceAll(percentScale(), (_, prop, percent) => {
      counts.scales++;

      return `${prop}: ${Number(percent) / 100}`;
    });

    if (css !== original) writeFileSync(file, css);
  }

  console.log(
    `shorthands ${counts.shorthands}, theme keyframes ${counts.keyframes}, slot names ` +
      `${counts.slots}, overwritten declarations removed ${counts.collapsed}, ` +
      `percentages made numbers ${counts.scales}`,
  );

  const where = (file) => path.relative(stylesRoot, file);

  const left = stylesheets().flatMap((file) =>
    [...readFileSync(file, "utf8").matchAll(anySlot())].map(([name]) => `${where(file)}: ${name}`),
  );

  if (left.length > 0) {
    console.error(`\n✗ ${left.length} animation slots did not move:`);
    for (const line of left.slice(0, 20)) console.error(`  ${line}`);
    process.exit(1);
  }

  /*
   * `--rp-duration` and `--rp-ease` stay unregistered, which is what they already were —
   * registering them would stop them inheriting, and a rule that sets one for a component sets it
   * for the component's parts too. Unregistered means every read has to carry its own fallback.
   */
  const bare = stylesheets().flatMap((file) =>
    [...readFileSync(file, "utf8").matchAll(/var\(\s*(--rp-(?:duration|ease))\s*\)/g)].map(
      ([, name]) => `${where(file)}: ${name}`,
    ),
  );

  if (bare.length > 0) {
    console.error(`\n✗ ${bare.length} reads of an unregistered slot with no fallback:`);
    for (const line of bare) console.error(`  ${line}`);
    process.exit(1);
  }

  console.log("✓ No Tailwind animation slot left, and no unregistered read without a fallback.");
};

main();
