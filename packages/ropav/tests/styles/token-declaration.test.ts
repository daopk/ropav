import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import postcss from "postcss";
import { describe, expect, it } from "vitest";

/**
 * Every token the shipped stylesheets read without a fallback is declared by something that ships.
 *
 * This is the check that was missing when the theme was Tailwind's. Thirty-three names — the whole
 * type scale, the font weights, the transition defaults, the container widths — were spelled
 * directly by component rules and declared by nobody in this repository: they arrived from
 * `tailwindcss/theme.css` because the entry imported it. Removing that import would have taken
 * `font-size: var(--rp-text-sm)` down on eighty-seven declarations at once, and not to the rule
 * underneath but to the property's initial value, with no error and no build failure. A page of
 * components at the browser's default size and weight, and a source that still said `--rp-text-sm`.
 *
 * `slot-registration.test.ts` asks a stricter question of the `--rp-*` composition slots, which
 * have to resolve on an element that sets none of them. This asks the flat one of everything
 * else: is the name declared anywhere at all.
 */

const STYLES = path.resolve(import.meta.dirname, "../../../styles");
const SOURCE = path.resolve(import.meta.dirname, "../../src");

/**
 * Names no stylesheet declares because a component writes them onto the element itself — an
 * overlay's measured trigger width, a panel's animated height, the visual viewport under a mobile
 * keyboard. A value only known at runtime cannot have a resting declaration, and giving one a
 * placeholder would mean the component renders at the placeholder for a frame.
 *
 * Held to the JavaScript below, so a name cannot be parked here to quiet the check.
 */
const SET_AT_RUNTIME = [
  "--color-area-background",
  "--color-area-thumb-color",
  "--color-swatch-current",
  "--disclosure-panel-height",
  "--front-height",
  "--toast-width",
  "--trigger-anchor-point",
  "--trigger-width",
  "--visual-viewport-height",
];

/**
 * `--rp-motion` is the exception, and it is the exception on purpose: being invalid *is* how it
 * turns motion off. See `motion.css`.
 */
const INVALID_BY_DESIGN = ["--rp-motion"];

/*
 * Built output and scratch directories are skipped by their path *inside* the package. The
 * repository itself lives under a `.claude` worktree, so a dot-segment test on the absolute path
 * matches every file there is — which is a filter that returns nothing and a check that passes
 * for having nothing to check.
 */
const files = (root: string, extensions: string[]) =>
  readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && extensions.some((end) => entry.name.endsWith(end)))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .filter((file) =>
      path
        .relative(root, file)
        .split(path.sep)
        .every((part) => part !== "dist" && part !== "node_modules" && !part.startsWith(".")),
    )
    .sort();

const stylesheets = [...files(STYLES, [".css"]), ...files(SOURCE, [".css"])].map((file) => ({
  file: path.relative(path.dirname(STYLES), file),
  root: postcss.parse(readFileSync(file, "utf8")),
}));

const declared = new Set([...SET_AT_RUNTIME, ...INVALID_BY_DESIGN]);

for (const { root } of stylesheets) {
  root.walkDecls((decl) => {
    if (decl.prop.startsWith("--")) declared.add(decl.prop);
  });
  root.walkAtRules("property", (rule) => {
    declared.add(rule.params);
  });
}

/** A read that names no fallback: `var(--x)`, not `var(--x, …)`. */
const BARE_READ = /var\(\s*(--[\w-]+)\s*\)/g;

const undeclared: string[] = [];
const readSomewhere = new Set<string>();

for (const { file, root } of stylesheets) {
  root.walkDecls((decl) => {
    for (const match of decl.value.matchAll(/var\(\s*(--[\w-]+)/g)) readSomewhere.add(match[1]!);

    for (const match of decl.value.matchAll(BARE_READ)) {
      const name = match[1]!;

      if (declared.has(name)) continue;
      undeclared.push(`${file}:${decl.source?.start?.line} ${decl.prop} reads ${name}`);
    }
  });
}

describe("the tokens the stylesheets read", () => {
  it("are declared by something that ships", () => {
    // An empty report is also what a walk that found no stylesheets produces.
    expect({ read: readSomewhere.size > 0, undeclared }).toEqual({ read: true, undeclared: [] });
  });

  /*
   * The allowlist, held to the code. A name here that nothing writes is a rule that has never
   * worked, wearing a note that says it works elsewhere.
   */
  it("include no runtime name the components do not actually set", () => {
    const source = files(SOURCE, [".ts", ".vue"]).map((file) => readFileSync(file, "utf8"));
    const unwritten = SET_AT_RUNTIME.filter(
      (name) => !source.some((text) => text.includes(`"${name}"`)),
    );

    expect(unwritten).toEqual([]);
  });

  it("include no runtime name nothing reads", () => {
    expect(SET_AT_RUNTIME.filter((name) => !readSomewhere.has(name))).toEqual([]);
  });
});

/**
 * A token that reads itself takes its own declaration down.
 *
 * `--x: var(--x)` is a cycle, and a cycle is not a fallback: the declaration is invalid at
 * computed-value time and the property computes to its initial, so a registered slot lands on its
 * `initial-value` and an unregistered one lands on nothing. It does not reach the inherited value
 * the author was reaching for — a parent declaring `--x` is not what `var(--x)` finds inside the
 * declaration of `--x`.
 *
 * Nothing else here would see one. The name is declared, so the check above passes; it is
 * registered with an initial value, so `slot-registration.test.ts` passes; the value is still a
 * length or a colour, so the palette checks pass. What moves is a resolved `box-shadow` on one
 * state of one component, which only a computed-style snapshot compares — and that snapshot runs
 * against a baseline that is not committed.
 *
 * Two shapes are flagged, and only these two, because only these two are cycles wherever they
 * land: a declaration reading its own property, and a chain that closes inside one rule, where
 * every declaration is resolving against the same element. A read that crosses rules is usually
 * reading an ancestor's value, which is how the whole theme reaches a component.
 */
const READS = /var\(\s*(--[\w-]+)/g;

const cycles: string[] = [];
let followed = 0;

for (const { file, root } of stylesheets) {
  root.walkRules((rule) => {
    const reads = new Map<string, string[]>();
    const lines = new Map<string, number | undefined>();

    for (const node of rule.nodes ?? []) {
      if (node.type !== "decl" || !node.prop.startsWith("--")) continue;
      followed++;
      reads.set(
        node.prop,
        [...node.value.matchAll(READS)].map((match) => match[1]!),
      );
      lines.set(node.prop, node.source?.start?.line);
    }

    for (const [prop, names] of reads) {
      const seen = new Set<string>();

      const closes = (name: string): boolean => {
        if (name === prop) return true;
        if (seen.has(name)) return false;
        seen.add(name);

        return (reads.get(name) ?? []).some(closes);
      };

      if (names.some(closes)) {
        cycles.push(`${file}:${lines.get(prop)} ${prop} resolves through itself`);
      }
    }
  });
}

describe("a token that resolves through itself", () => {
  it("is declared nowhere", () => {
    // Vacuous unless the walk found declarations to follow.
    expect({ cycles, followed: followed > 0 }).toEqual({ cycles: [], followed: true });
  });
});
