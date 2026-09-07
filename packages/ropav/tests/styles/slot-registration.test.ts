import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import postcss from "postcss";
import { describe, expect, it } from "vitest";

/**
 * A slot read with no fallback has to resolve to something, or it takes its declaration with it.
 *
 * `var(--rp-x)` where nothing set `--rp-x` and no `@property` gave it an initial value is the
 * guaranteed-invalid value. That does not fall back to the previous declaration and it does not
 * leave the property alone: the whole declaration is invalid at computed-value time and the
 * property computes to its initial. `border-style: var(--rp-border-style)` becomes `none`, and
 * the border it was sizing disappears — on one element, in one state, with the source still
 * saying `border-width: 1px`.
 *
 * That one shipped as far as a working tree. Renaming the composition slots off Tailwind's prefix
 * moved the reads and left the `@property` blocks behind, and `.rp-button--outline` lost its
 * border in every theme; only a computed-style snapshot caught it, and only because one happened
 * to be running. `slots.css` is hand-maintained now, so the next one would not have that luck.
 */

const STYLES = path.resolve(import.meta.dirname, "../../../styles");

const stylesheets = readdirSync(STYLES, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".css"))
  .map((entry) => path.join(entry.parentPath, entry.name))
  .filter((file) => !file.includes(`${path.sep}dist${path.sep}`) && !file.includes("node_modules"))
  .sort();

const roots = stylesheets.map((file) => ({
  file: path.relative(STYLES, file),
  root: postcss.parse(readFileSync(file, "utf8")),
}));

/**
 * `--rp-motion` is the exception, and it is the exception on purpose: being invalid *is* how it
 * turns motion off. See `motion.css`. Registering it would give it something to resolve to and
 * the gate would stop working.
 */
const INVALID_BY_DESIGN = new Set(["--rp-motion"]);

const registered = new Map<string, boolean>();

for (const { root } of roots) {
  root.walkAtRules("property", (rule) => {
    if (rule.params.startsWith("--rp-")) {
      registered.set(rule.params, /initial-value\s*:/.test(rule.toString()));
    }
  });
}

/**
 * A prefixed name the themes declare is a token, not a slot.
 *
 * The two tiers share the `--rp-` namespace, so the prefix alone no longer says which is which.
 * The boundary is the path. A name declared by a rule under `themes/` is a theme token — set on
 * `:root` or on a `data-theme` element and inherited down — so a component reading one is reading
 * an ancestor, not composing a property out of contributions that may all be absent. A slot is
 * every other prefixed name, and it still has to resolve on an element that sets none of them.
 *
 * Keyed off the path rather than a list of names, because a list is what would go stale: a token
 * added to a theme is excluded by where it is written, and a slot added without a registration
 * still fails here, which is the case this check was written for.
 */
const themeTokens = new Set<string>();

for (const { file, root } of roots) {
  if (!file.startsWith(`themes${path.sep}`)) continue;

  root.walkDecls((decl) => {
    if (decl.prop.startsWith("--rp-")) themeTokens.add(decl.prop);
  });
}

/**
 * Everything one element sees from one rule: its own declarations, and those of any `@media` or
 * `@supports` nested inside it. Not a nested *rule* — that selects a different element, or the
 * same one in a state this one cannot count on.
 */
const declaredOnElement = (container: postcss.Container): Set<string> => {
  const names = new Set<string>();

  for (const node of container.nodes ?? []) {
    if (node.type === "decl" && node.prop.startsWith("--rp-")) names.add(node.prop);
    if (node.type === "atrule" && node.name !== "property") {
      for (const name of declaredOnElement(node)) names.add(name);
    }
  }

  return names;
};

/** A read that names no fallback: `var(--rp-x)`, not `var(--rp-x, …)`. */
const BARE_READ = /var\(\s*(--rp-[\w-]+)\s*\)/g;

const unresolvable: string[] = [];
const readSomewhere = new Set<string>();

for (const { file, root } of roots) {
  root.walkRules((rule) => {
    const onElement = declaredOnElement(rule);

    for (const node of rule.nodes ?? []) {
      if (node.type !== "decl") continue;

      for (const match of node.value.matchAll(BARE_READ)) {
        const name = match[1]!;

        if (onElement.has(name) || registered.get(name) === true) continue;
        if (themeTokens.has(name)) continue;
        if (INVALID_BY_DESIGN.has(name)) continue;

        const why = registered.has(name) ? "registered with no initial-value" : "not registered";

        unresolvable.push(
          `${file}:${node.source?.start?.line} ${node.prop} reads ${name} — ${why}`,
        );
      }
    }
  });

  root.walkDecls((decl) => {
    for (const match of decl.value.matchAll(/var\(\s*(--rp-[\w-]+)/g)) {
      readSomewhere.add(match[1]!);
    }
  });
}

describe("composition slots", () => {
  it("resolve to something wherever they are read without a fallback", () => {
    expect(unresolvable).toEqual([]);
  });

  /*
   * The other direction. The set shrinks by hand as each composed group is dissolved, and a
   * registration nobody reads is the residue of one that was — dead weight in every consumer's
   * stylesheet, under a name that still looks like it means something.
   */
  it("are all still read by something", () => {
    expect([...registered.keys()].filter((name) => !readSomewhere.has(name)).sort()).toEqual([]);
  });
});
