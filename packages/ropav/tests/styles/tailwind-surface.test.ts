import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Nothing in either published package needs Tailwind to compile it.
 *
 * The failure this guards against has already shipped once. `@ropav/styles` named an entry made
 * of `@import` statements as its stylesheet, so an app without a Tailwind 4 toolchain resolved it,
 * got nothing, and rendered unstyled — no error anywhere, because an `@import` of something that
 * does not compile is not a failure, it is an empty file. That is why an import whose specifier
 * begins with `tailwindcss` is on this list too, not only the at-rules: it is the shape the real
 * breakage took.
 *
 * This was a ledger that shrank through the migration, a file at a time, and 0.10.0 emptied it by
 * deleting the interop entry and the two files behind it. An empty expectation is not a spent
 * test — it is the strongest this one has ever been, and the only state in which the sentence at
 * the top is simply true. Anything reintroducing an at-rule only a Tailwind build understands
 * fails here rather than in an app that has no such build.
 */

const STYLES = path.resolve(import.meta.dirname, "../../../styles");
const ROPAV = path.resolve(import.meta.dirname, "../../src");

/** Empty, and it stays empty. */
const NEEDS_TAILWIND: Record<string, string[]> = {};

/*
 * Not anchored to the start of a line. These files are hand-formatted, so an at-rule is on its own
 * line in practice — but "in practice" is what a check is for, and a rule folded onto one line
 * with its selector is still a rule. The leading boundary is what keeps it from matching inside a
 * URL or an identifier that happens to end in one of these words.
 */
const AT_RULE =
  /(?:^|[\s{;])@(apply|utility|custom-variant|theme|source|plugin|config|reference|variant)\b/g;
const TAILWIND_IMPORT = /(?:^|[\s{;])@import\s+["'](tailwindcss[^"']*)["']/g;

const stylesheets = (root: string, label: string) =>
  readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".css"))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .filter((file) => !file.includes(`${path.sep}dist${path.sep}`))
    .filter((file) => !file.includes("node_modules"))
    .map((file) => [`${label}/${path.relative(root, file)}`, file] as const)
    .sort();

/**
 * Comments are blanked rather than stripped, so a commented-out rule cannot be mistaken for a live
 * one. Several files carry a disabled block that mentions one.
 */
const live = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, (block) => " ".repeat(block.length));

const sources = [...stylesheets(STYLES, "styles"), ...stylesheets(ROPAV, "ropav")];

const found: Record<string, string[]> = {};

for (const [name, file] of sources) {
  const css = live(readFileSync(file, "utf8"));
  const counted = new Map<string, number>();

  const note = (hit: string) => counted.set(hit, (counted.get(hit) ?? 0) + 1);

  for (const [, rule] of css.matchAll(AT_RULE)) note(`@${rule}`);
  for (const [, specifier] of css.matchAll(TAILWIND_IMPORT)) note(`@import "${specifier}"`);

  if (counted.size === 0) continue;

  found[name] = [...counted].sort().map(([hit, times]) => (times > 1 ? `${hit} ×${times}` : hit));
}

describe("the published stylesheets", () => {
  /*
   * What the expectation above is worth depends entirely on this one. An empty report is also
   * what a walk that reached no files produces, and a filter that quietly matches nothing is not
   * hypothetical — one here once excluded every path by matching a dot-segment that turned out to
   * be in the checkout's own directory name, and the suite stayed green while measuring nothing.
   *
   * A floor rather than an exact count: files come and go, and the number is here to tell "read
   * the whole package" apart from "read nothing", not to be maintained.
   */
  it("were read at all", () => {
    expect(sources.length).toBeGreaterThan(80);
  });

  it("need Tailwind nowhere", () => {
    expect(found).toEqual(NEEDS_TAILWIND);
  });
});

/**
 * The same sentence, about the other half of what ships.
 *
 * The stylesheets were the whole of this check for as long as CSS was the only place a utility
 * could hide. It was not: `@ropav/styles` exported three constants made of `focus-visible:ring-*`
 * and `disabled:opacity-[var(--disabled-opacity)]` from its root, for a package that compiles no
 * Tailwind — a consumer importing one got a string that named nothing. Nobody called them, which
 * is the only reason it never showed.
 *
 * Two shapes are read here. A string literal carrying a variant prefix or an arbitrary bracket is
 * the first, and it is what those three were. The second is narrower and stronger: every class a
 * template actually writes has to be one the package defines. That is the one that catches a
 * completion accepted inside component source — `class="p-0"` on the mobile sidebar's dialog and
 * `class="sr-only"` on its heading, both of which resolved to nothing in an app with no build, and
 * between them left a drawer that kept the padding it meant to drop and read its accessible name
 * out as visible copy.
 *
 * Stories are excluded from both. Storybook runs Tailwind for its own sake and says so.
 */

const SOURCE_ROOTS = [
  ["styles", path.resolve(import.meta.dirname, "../../../styles/src")],
  ["ropav", ROPAV],
] as const;

/** A variant prefix, which nothing but a Tailwind build gives meaning to. */
const UTILITY_VARIANT =
  /(?:^|\s)(?:group-|peer-)?(?:hover|focus|focus-visible|focus-within|active|disabled|aria-disabled|checked|dark|rtl|ltr|sm|md|lg|xl|2xl|first|last|odd|even|motion-safe|motion-reduce|print):[a-z[]/;

/** An arbitrary value (`text-[var(--muted)]`) or an arbitrary property (`[--button-bg:red]`). */
const UTILITY_ARBITRARY = /[\w)\]]-\[|(?:^|\s)\[--[a-z-]+:/;

const STRING_LITERAL = /"([^"\\\n]*)"|'([^'\\\n]*)'|`([^`\\]*)`/g;

/** A literal `class` attribute. A bound one is an expression, and its strings are read above. */
const CLASS_ATTRIBUTE = /(?<![:@\w-])class="([^"{}]*)"/g;

const sourceFiles = SOURCE_ROOTS.flatMap(([label, root]) =>
  readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(ts|vue)$/.test(entry.name))
    .filter((entry) => !entry.name.endsWith(".stories.ts"))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .filter((file) => !file.includes("node_modules"))
    .map((file) => [`${label}/${path.relative(root, file)}`, file] as const),
).sort();

/** Every class name the two packages' stylesheets define, which is what a template may name. */
const shipped = new Set(
  [...stylesheets(STYLES, "styles"), ...stylesheets(ROPAV, "ropav")].flatMap(([, file]) =>
    [...live(readFileSync(file, "utf8")).matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map(
      ([, name]) => name!,
    ),
  ),
);

describe("the published sources", () => {
  it("were read at all", () => {
    expect(sourceFiles.length).toBeGreaterThan(400);
    expect(shipped.size).toBeGreaterThan(500);
  });

  it("name no utility a Tailwind build would have to compile", () => {
    const naming = sourceFiles.flatMap(([name, file]) =>
      readFileSync(file, "utf8")
        .split("\n")
        .flatMap((line, index) =>
          [...line.matchAll(STRING_LITERAL)]
            .map((match) => match[1] ?? match[2] ?? match[3] ?? "")
            .filter((value) => UTILITY_VARIANT.test(value) || UTILITY_ARBITRARY.test(value))
            .map((value) => `${name}:${index + 1}: ${value}`),
        ),
    );

    expect(naming).toEqual([]);
  });

  it("name only classes the package ships", () => {
    const unresolved = sourceFiles.flatMap(([name, file]) =>
      readFileSync(file, "utf8")
        .split("\n")
        .flatMap((line, index) =>
          [...line.matchAll(CLASS_ATTRIBUTE)]
            .flatMap((match) => match[1]!.split(/\s+/))
            .filter(Boolean)
            .filter((token) => !shipped.has(token))
            .map((token) => `${name}:${index + 1}: ${token}`),
        ),
    );

    expect(unresolved).toEqual([]);
  });
});

/**
 * The docs are held to the finished standard rather than the ledger, because a reader copies what
 * they see and a reader is not on the migration's timetable.
 *
 * `forced-colors.md` taught `@apply forced-selected` as the way to restate a selected background
 * for Forced Colors Mode. For anyone not running Tailwind that snippet compiled to nothing, and
 * what it produced was not an error but a missing focus indicator — the exact failure the page
 * exists to prevent, in the page that explains it.
 */

const DOCS = path.resolve(import.meta.dirname, "../../../docs");

/**
 * Pages, not the site. The docs app compiles its own Tailwind for its own chrome and says so with
 * `@source` in its stylesheet — that is its build talking to itself, and no reader copies it. What
 * a reader copies is a fenced block on a page.
 */
const pages = readdirSync(DOCS, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.(md|vue)$/.test(entry.name))
  .map((entry) => path.join(entry.parentPath, entry.name))
  .filter(
    (file) => !file.includes("node_modules") && !file.includes(`${path.sep}.vitepress${path.sep}`),
  )
  .sort();

/**
 * Only what a reader would copy: fenced blocks on a page, and the `<style>` of a demo whose source
 * the site puts on show. Prose is left alone deliberately — a page is allowed to name `@apply` in
 * order to say it has gone, and a check that forbade the word would forbid explaining it.
 */
const copyable = (source: string): string[] => [
  ...[...source.matchAll(/^```[^\n]*\n([\s\S]*?)^```/gm)].map((match) => match[1]!),
  ...[...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((match) => match[1]!),
];

/**
 * A custom property written as a class — `class="[--button-bg-hover:var(--success)]"` — was how
 * every page taught the one mechanism this library offers for retuning a state. It is a class name
 * and nothing else to a reader with no build to compile it: no error, no colour, no clue.
 *
 * Narrow on purpose. An arbitrary *value* — `bg-[var(--accent)]` — stays legal, because
 * `guide/installation.md` shows it deliberately and labels it as the Tailwind spelling of reading
 * a token. It is the arbitrary *property* that has no meaning outside one build and a strictly
 * better replacement inside every other: the `style` attribute, which needs none.
 */
const ARBITRARY_PROPERTY = /\[--[a-z][\w-]*\s*:/g;

/**
 * The demos are the part of the docs a reader actually copies - the page transcludes each one's
 * source - so they are held to the same standard as a fenced block, and more strictly: a demo is
 * a working file, and a utility in one compiles only because this site happens to run Tailwind for
 * its own chrome. Every one of them is written in the tokens now, which is what a reader can take.
 */
const demos = readdirSync(path.join(DOCS, ".vitepress/theme/demos"), { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".vue"))
  .map((entry) => path.join(entry.parentPath, entry.name))
  .sort();

/** A literal `class` attribute, ignoring bound ones - those are expressions, not class lists. */
const DEMO_CLASS = /(?<![:@\w-])class="([^"{}]*)"/g;

describe("the demos", () => {
  it("were read at all", () => {
    expect(demos.length).toBeGreaterThan(60);
  });

  it("name no class a build has to compile", () => {
    const naming = demos.flatMap((file) => {
      const source = readFileSync(file, "utf8");
      // Anywhere in the block, not just where a selector starts: a rule reaching a tag the docs'
      // prose revert also claims has to be written through an ancestor, `.stack .note`.
      const style = /<style[^>]*>([\s\S]*?)<\/style>/.exec(source)?.[1] ?? "";
      const declared = new Set([...style.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(([, name]) => name!));

      return [...source.matchAll(DEMO_CLASS)]
        .flatMap((match) => match[1]!.split(/\s+/))
        .filter(Boolean)
        .filter((token) => !token.startsWith("rp-") && !declared.has(token))
        .map((token) => `${path.basename(file)}: ${token}`);
    });

    expect([...new Set(naming)]).toEqual([]);
  });
});

describe("the documentation", () => {
  it("was read at all", () => {
    expect(pages.length).toBeGreaterThan(60);
  });

  it("teaches no authoring API that needs Tailwind to exist", () => {
    const teaching = pages.flatMap((file) => {
      const hits = copyable(readFileSync(file, "utf8")).flatMap((block) =>
        [...live(block).matchAll(AT_RULE)].map(([, rule]) => `@${rule}`),
      );

      return [...new Set(hits)].map((hit) => `${path.relative(DOCS, file)}: ${hit}`);
    });

    expect(teaching).toEqual([]);
  });

  it("sets a custom property with the attribute rather than with a class", () => {
    const teaching = pages.flatMap((file) => {
      const hits = copyable(readFileSync(file, "utf8")).flatMap((block) =>
        [...block.matchAll(ARBITRARY_PROPERTY)].map(([hit]) => hit),
      );

      return [...new Set(hits)].map((hit) => `${path.relative(DOCS, file)}: ${hit}`);
    });

    expect(teaching).toEqual([]);
  });
});
