/**
 * Rewrites the utilities that only exist because `themes/shared/theme.css` maps this package's
 * tokens onto Tailwind's namespaces, into arbitrary values that read the token directly.
 *
 *   text-muted        ->  text-[var(--muted)]
 *   bg-accent/10      ->  bg-[var(--accent)]/10
 *   rounded-3xl       ->  rounded-[calc(var(--radius)*3)]
 *   ease-out-quad     ->  ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
 *
 * The entry that carries that mapping goes away, so every one of these would otherwise stop
 * resolving — silently for the colours, which fall back to the property's initial value, and
 * worse than silently for the eight `--radius-*` names, which are Tailwind's own and would keep
 * working at a different size.
 *
 *   node scripts/migration/interop.mjs           # report only
 *   node scripts/migration/interop.mjs --write
 *
 * Nothing is written until the oracle below agrees, for every replacement, that Tailwind compiles
 * the new class to the same declarations as the old one.
 */
/* eslint-disable no-console */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const STYLES = path.resolve(import.meta.dirname, "../..");
const REPO = path.resolve(STYLES, "../..");

/*
 * Tailwind is resolved from `packages/ropav`, not from here. This package deliberately cannot see
 * it any more - that is what 0.9.0 was - so a script that lives here still has to borrow the
 * compiler from a package that keeps one for its own test app.
 */
const require = createRequire(path.join(REPO, "packages/ropav/package.json"));
const TAILWIND = path.dirname(require.resolve("tailwindcss/package.json"));
const { compile } = await import(path.join(TAILWIND, "dist/lib.mjs"));
const THEME = path.join(STYLES, "themes/shared/theme.css");

/** The namespaces a utility can come from, and the prefixes that spell each one. */
const NAMESPACES = {
  color:
    "bg text border ring outline divide fill stroke shadow from via to accent caret decoration placeholder".split(
      " ",
    ),
  ease: ["ease"],
  radius: ["rounded"],
  shadow: ["shadow"],
};

const theme = readFileSync(THEME, "utf8");

/**
 * An arbitrary value cannot carry a space, and none of these needs one: `calc(var(--radius) * 3)`
 * and `calc(var(--radius)*3)` parse the same, and Tailwind prints the spaces back.
 *
 * The theme's *value* is what gets inlined, never a `var()` naming the theme token itself, even
 * where `tokens.css` happens to declare the same name. `ease-out-quad` compiles to the literal
 * curve today, and reaching through `var(--ease-out-quad)` instead would be a change - small, but
 * this migration's whole claim is that there isn't one.
 */
const arbitrary = (value) => value.replace(/\s+/g, "");

/** utility name -> the arbitrary value that replaces its token. */
const replacement = new Map();

/*
 * Namespace order matters, and only for `shadow-`, which two of them spell. Tailwind resolves
 * `shadow-field` against `--shadow-field` and not `--color-field`; reading the theme top to bottom
 * gets that backwards, because the colour is declared further down the file and wins the key.
 */
for (const namespace of ["color", "ease", "radius", "shadow"])
  for (const [, name, value] of theme.matchAll(
    new RegExp(String.raw`^\s*--${namespace}-([a-z0-9-]+):\s*([^;]+);`, "gm"),
  ))
    for (const prefix of NAMESPACES[namespace])
      replacement.set(`${prefix}-${name}`, arbitrary(value.trim()));

/*
 * Tokens are whitespace- and quote-delimited, never matched inside a longer string. A regex over
 * the raw text reads `./text-field.types` as the `text-field` utility and a story's prose
 * "Standard card appearance (bg-surface)" as `bg-surface`, because the characters on either side
 * are not word characters. Splitting first is what makes a class a class.
 */
const DELIMITER = /([\s"'`]+)/;

/**
 * Ranges a class cannot be in. Prose names these utilities in order to talk about them - "the
 * whole text-field behaviour", "so a demo can write `text-muted`" - and a comment is where that
 * happens, so rewriting one turns an explanation into nonsense.
 */
const comments = (source) => {
  const ranges = [];

  for (const match of source.matchAll(/\/\*[\s\S]*?\*\//g))
    ranges.push([match.index, match.index + match[0].length]);

  return ranges;
};

const inside = (ranges, at) => ranges.some(([from, to]) => at >= from && at < to);

/** A class token: any number of variants, the utility, an optional opacity modifier. */
const parse = (token) => {
  const cut = token.lastIndexOf(":");
  const variants = cut === -1 ? "" : token.slice(0, cut + 1);
  const rest = token.slice(cut + 1);
  const modifier = /\/[\d.]+$/.exec(rest)?.[0] ?? "";

  return { modifier, utility: rest.slice(0, rest.length - modifier.length), variants };
};

const rewrite = (token) => {
  const { modifier, utility, variants } = parse(token);
  const target = replacement.get(utility);

  return target === undefined ? null : `${variants}${utility.split("-")[0]}-[${target}]${modifier}`;
};

/*
 * Markdown is left out on purpose, and done by hand. Its prose names these utilities inside
 * backticks, and a backtick is a delimiter - so `bg-accent` in a sentence tokenises exactly like
 * a class in an attribute, with nothing in the text to tell them apart. Seven places, two files.
 */
const sources = [
  "packages/ropav/src",
  "packages/ropav/tests",
  "packages/docs",
  "packages/storybook",
]
  .flatMap((dir) =>
    readdirSync(path.join(REPO, dir), { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.(css|ts|vue)$/.test(entry.name))
      .map((entry) => path.join(entry.parentPath, entry.name)),
  )
  .filter(
    (file) =>
      !file.includes("node_modules") &&
      !file.includes(`${path.sep}dist${path.sep}`) &&
      !file.includes("storybook-static") &&
      !file.includes(`${path.sep}.vitepress${path.sep}`),
  )
  .sort();

const edits = [];
const pairs = new Map();

const skipped = [];

for (const file of sources) {
  const before = readFileSync(file, "utf8");
  const ranges = comments(before);
  const parts = before.split(DELIMITER);
  let at = 0;
  let touched = 0;

  for (const [index, part] of parts.entries()) {
    const start = at;

    at += part.length;

    if (index % 2 === 1) continue; // the delimiters themselves

    const next = rewrite(part);

    if (next === null) continue;

    if (inside(ranges, start)) {
      skipped.push(`${path.relative(REPO, file)}: ${part} (in a comment)`);
      continue;
    }

    pairs.set(part, next);
    parts[index] = next;
    touched += 1;
  }

  if (touched > 0) edits.push({ after: parts.join(""), file, touched });
}

/*
 * The oracle. Both class sets are compiled by the same Tailwind, the old one with the theme this
 * change deletes and the new one without it, and a replacement is only accepted if the two emit
 * the same declarations. That is the whole safety argument: 500-odd edits are worth exactly as
 * much as the proof that each one means what it replaced.
 */
const load = async (id, base) => {
  const file = id.startsWith("tailwindcss")
    ? path.join(
        TAILWIND,
        id === "tailwindcss" ? "index.css" : `${id.replace(/^tailwindcss\//, "")}.css`,
      )
    : path.resolve(base, id);

  return { base: path.dirname(file), content: readFileSync(file, "utf8") };
};

/**
 * Every rule in a compiled sheet, keyed by its selector with the CSS escapes taken back out -
 * `.text-\[var\(--muted\)\]` is filed under `.text-[var(--muted)]`. Reconstructing the escaped
 * form instead means reimplementing Tailwind's escaping and being wrong about one character;
 * removing backslashes is the same question asked in the direction that cannot be wrong.
 *
 * Braces are matched rather than searched for, because an opacity modifier nests an `@supports`
 * inside the rule and a non-greedy `}` stops at its closing brace.
 */
const rules = (css) => {
  const found = new Map();
  let start = 0;

  for (let at = 0; at < css.length; at += 1) {
    if (css[at] === "\\") {
      at += 1;
      continue;
    }

    if (css[at] === "}" || css[at] === ";") {
      start = at + 1;
      continue;
    }

    if (css[at] !== "{") continue;

    const selector = css.slice(start, at);

    start = at + 1;

    /*
     * A variant does not always leave its class flush against the brace. `[&_path]:fill-*`
     * compiles to a descendant selector and `*:data-*` to one wrapped in `:is(... > *)`, so the
     * class is found anywhere in the selector rather than anchored to either end. At-rules are
     * skipped as selectors but not as content - the body of a `@media` still holds rules.
     */
    if (selector.includes("@")) continue;

    const dot = /(?:^|[\s(>+~,:*])\.((?:\\.|[^\s{};,)])+)/.exec(selector);

    if (dot === null) continue;

    let depth = 1;
    let end = at + 1;

    while (depth > 0 && end < css.length) {
      if (css[end] === "{") depth += 1;
      else if (css[end] === "}") depth -= 1;
      end += 1;
    }

    found.set(className(dot[1]), normalise(css.slice(at + 1, end - 1)));
  }

  return found;
};

/**
 * The class a selector starts with, told apart from what a variant appended to it. Both spell `:`,
 * and only one of them is escaped: `.hover\:bg-red-500:hover` is the class `hover:bg-red-500`
 * followed by a real pseudo-class. Reading the backslashes is the only way to know where one ends.
 */
const className = (selector) => {
  let name = "";

  for (let at = 0; at < selector.length; at += 1) {
    if (selector[at] === "\\") {
      name += selector[at + 1];
      at += 1;
      continue;
    }

    if (/[:[>+~. ]/.test(selector[at])) break;

    name += selector[at];
  }

  return name;
};

/**
 * Whitespace inside parentheses is dropped on both sides of the comparison, because an arbitrary
 * value cannot carry any and Tailwind prints back whatever it was given: `cubic-bezier(0.25, 0.46,
 * 0.45, 0.94)` and `cubic-bezier(0.25,0.46,0.45,0.94)` are the same curve. Outside parentheses it
 * is left alone, where it still separates one component of a value from the next.
 */
const normalise = (body) => {
  let depth = 0;
  let out = "";

  for (const character of body.replace(/\s+/g, " ").trim()) {
    if (character === "(") depth += 1;
    else if (character === ")") depth -= 1;

    if (character === " " && depth > 0) continue;

    out += character;
  }

  return out;
};

const withTheme = await compile(`@import "tailwindcss";\n@import "${THEME}";`, {
  base: TAILWIND,
  loadStylesheet: load,
});
const withoutTheme = await compile(`@import "tailwindcss";`, {
  base: TAILWIND,
  loadStylesheet: load,
});

const oldRules = rules(withTheme.build([...pairs.keys()]));
const newRules = rules(withoutTheme.build([...pairs.values()]));
const disagreed = [];

for (const [before, after] of pairs) {
  const one = oldRules.get(before);
  const two = newRules.get(after);

  if (one !== undefined && one === two) continue;

  disagreed.push({
    after,
    before,
    emitted: two ?? "(nothing emitted)",
    expected: one ?? "(nothing emitted)",
  });
}

const uses = edits.reduce((total, edit) => total + edit.touched, 0);

console.log(`${uses} uses of ${pairs.size} utilities, in ${edits.length} files`);

if (skipped.length > 0) {
  console.log(`\n${skipped.length} left alone, for a human to read:`);
  for (const note of skipped) console.log(`  ${note}`);
}

if (disagreed.length > 0) {
  console.error(`\n${disagreed.length} replacements do not compile to what they replace:\n`);
  for (const { after, before, emitted, expected } of disagreed)
    console.error(`  ${before}\n    was  ${expected}\n    now  ${emitted}\n    as   ${after}\n`);
  process.exit(1);
}

console.log("every replacement compiles to the declarations it replaces");

if (!process.argv.includes("--write")) {
  console.log("\n(report only - pass --write to apply)");
  for (const [before, after] of [...pairs].sort()) console.log(`  ${before}  ->  ${after}`);
  process.exit(0);
}

for (const { after, file } of edits) writeFileSync(file, after);
console.log(`written to ${edits.length} files`);
