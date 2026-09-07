import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import postcss from "postcss";
import { describe, expect, it } from "vitest";

/**
 * The themes claim no name another design system's consumers already spell.
 *
 * A custom property declared on `:root` belongs to whoever declared it last. Tailwind emits its
 * whole default theme as `:root, :host` inside `@layer theme`; a theme here declaring the same
 * name on `:root` in the same layer ties on specificity, and the tie is broken by import order —
 * so either the consumer's `@theme` was discarded, or their value was inside every component
 * here. Neither raises anything: both sides are valid CSS and the loser simply stops applying.
 *
 * Two vocabularies, read two different ways, because one of them cannot be read.
 *
 * Tailwind's is read from the package, so it tracks the version the workspace pins rather than a
 * list that goes stale a minor behind. Its deprecated block is included on purpose: those names
 * emit no variable, but they are still substitution sources for the utilities that carry their
 * bare form, so declaring one still changes what a consumer's `rounded` resolves to.
 *
 * shadcn's cannot be read — it is copied into an app rather than installed, so there is no
 * package to resolve. It is pinned below, and it is the half a Tailwind-only check would miss:
 * `--background`, `--foreground`, `--muted`, `--accent` and `--border` are not Tailwind's names
 * at all. An app built on those plus this library is the ordinary case, not an exotic one.
 */
const SHADCN = [
  "--accent",
  "--accent-foreground",
  "--background",
  "--border",
  "--card",
  "--card-foreground",
  "--destructive",
  "--destructive-foreground",
  "--foreground",
  "--input",
  "--muted",
  "--muted-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--radius",
  "--ring",
  "--secondary",
  "--secondary-foreground",
];

const REPO = execSync("git rev-parse --show-toplevel", {
  cwd: import.meta.dirname,
  encoding: "utf8",
}).trim();

const names = (css: string) => {
  const found = new Set<string>();

  postcss.parse(css).walkDecls((decl) => {
    if (decl.prop.startsWith("--")) found.add(decl.prop);
  });

  return found;
};

const themeSheets = execSync("git ls-files packages/styles/themes", {
  cwd: REPO,
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter((file) => file.endsWith(".css"));

const declared = new Set<string>();

for (const file of themeSheets) {
  for (const name of names(readFileSync(path.join(REPO, file), "utf8"))) declared.add(name);
}

const tailwind = names(readFileSync(import.meta.resolve("tailwindcss/theme.css").slice(7), "utf8"));

describe("the names the themes declare", () => {
  it("are none of Tailwind's", () => {
    // Vacuous if the resolved stylesheet turned out to be empty or unparsed.
    expect({
      read: tailwind.size > 300,
      shared: [...declared].filter((name) => tailwind.has(name)).sort(),
    }).toEqual({ read: true, shared: [] });
  });

  it("are none of shadcn's", () => {
    expect([...declared].filter((name) => SHADCN.includes(name)).sort()).toEqual([]);
  });
});
