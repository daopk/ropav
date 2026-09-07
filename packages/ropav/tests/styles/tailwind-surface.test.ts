import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Everything that still needs Tailwind to compile it is behind one entry, and that entry is
 * reached by nothing the stylesheet imports.
 *
 * The failure this guards against has already shipped once. `@ropav/styles` named an entry made
 * of `@import` statements as its stylesheet, so an app without a Tailwind 4 toolchain resolved it,
 * got nothing, and rendered unstyled — no error anywhere, because an `@import` of something that
 * does not compile is not a failure, it is an empty file. That is why an import whose specifier
 * begins with `tailwindcss` is on this list too, not only the at-rules: it is the shape the real
 * breakage took.
 *
 * The list was a ledger that shrank through the migration, a file at a time. What is left is not
 * debt: it is the interop entry's own two files, which exist so that an app writing `bg-accent`
 * against these tokens keeps working through one release. `tailwind.css` is the only thing that
 * imports them, which is the second test below and the more important half — an entry the
 * stylesheet does not pull in is one that 0.10.0 can delete by deleting the file.
 */

const STYLES = path.resolve(import.meta.dirname, "../../../styles");
const ROPAV = path.resolve(import.meta.dirname, "../../src");

/** What is left, and nothing else. Names are as a reader would grep for them. */
const NEEDS_TAILWIND: Record<string, string[]> = {
  "styles/themes/shared/theme.css": ["@theme"],
  "styles/variants/index.css": ["@custom-variant ×3"],
};

/** The entry those two are behind, and the only file allowed to name them. */
const INTEROP = "styles/tailwind.css";

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

const ANY_IMPORT = /@import\s+["']([^"']+)["']/g;

const sources = [...stylesheets(STYLES, "styles"), ...stylesheets(ROPAV, "ropav")];
/** Absolute path back to the name the report uses, so a resolved import can be named. */
const named = new Map(sources.map(([name, file]) => [file, name]));

const found: Record<string, string[]> = {};
/** Which stylesheets `@import` each of the listed ones. */
const importedBy = new Map<string, string[]>(Object.keys(NEEDS_TAILWIND).map((n) => [n, []]));

for (const [name, file] of sources) {
  const css = live(readFileSync(file, "utf8"));
  const counted = new Map<string, number>();

  const note = (hit: string) => counted.set(hit, (counted.get(hit) ?? 0) + 1);

  for (const [, rule] of css.matchAll(AT_RULE)) note(`@${rule}`);
  for (const [, specifier] of css.matchAll(TAILWIND_IMPORT)) note(`@import "${specifier}"`);

  for (const match of css.matchAll(ANY_IMPORT)) {
    const specifier = match[1]!;

    if (!specifier.startsWith(".")) continue;

    const target = named.get(path.resolve(path.dirname(file), specifier));

    if (target && importedBy.has(target)) importedBy.get(target)!.push(name);
  }

  if (counted.size === 0) continue;

  found[name] = [...counted].sort().map(([hit, times]) => (times > 1 ? `${hit} ×${times}` : hit));
}

describe("the published stylesheets", () => {
  it("need Tailwind only in the interop entry's own two files", () => {
    expect(found).toEqual(NEEDS_TAILWIND);
  });

  /*
   * The half that makes the first one mean something. Two files that need a Tailwind build are
   * harmless while nothing the stylesheet loads reaches them, and are the shipped bug of Đợt A
   * the moment one does — `index.css` importing `theme.css` again would put a `@theme` back into
   * the file an app with no toolchain loads, and it would render as an empty block.
   */
  it("reach those two from the interop entry and nowhere else", () => {
    expect(Object.fromEntries(importedBy)).toEqual(
      Object.fromEntries(Object.keys(NEEDS_TAILWIND).map((name) => [name, [INTEROP]])),
    );
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

describe("the documentation", () => {
  it("teaches no authoring API that needs Tailwind to exist", () => {
    const teaching = pages.flatMap((file) => {
      const hits = copyable(readFileSync(file, "utf8")).flatMap((block) =>
        [...live(block).matchAll(AT_RULE)].map(([, rule]) => `@${rule}`),
      );

      return [...new Set(hits)].map((hit) => `${path.relative(DOCS, file)}: ${hit}`);
    });

    expect(teaching).toEqual([]);
  });
});
