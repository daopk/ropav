/**
 * Asks Tailwind what an `@apply` list means, and returns it as CSS that can stand on its own.
 *
 * Nothing here decides anything. Every value, every variant selector, every token substitution is
 * whatever the compiler in the build today produces — which is the only definition of "the same
 * styles" worth migrating against. Hand-porting 1,430 statements would be a rewrite wearing a
 * refactor's clothes.
 *
 * The mechanism is a probe stylesheet: one throwaway rule per distinct argument list, compiled by
 * the same CLI the bundle uses, then read back and re-rooted onto `&`. Every Tailwind variant is
 * already relative to the element, so the arbitrary values, the `-(--token)` references, the
 * responsive and state variants and — most importantly — the `inline` theme substitutions all
 * come back correct without a single rule written here to handle them.
 *
 * An unknown utility makes the compile fail loudly rather than expanding to nothing.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import postcss from "postcss";

const stylesRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);

/**
 * Fixed width, so no marker is a prefix of another. `.rp-probe-1` inside `.rp-probe-10` is a
 * silent mis-attribution: the shorter list quietly collects the longer one's declarations.
 */
const marker = (index) => `.rp-probe-${String(index).padStart(4, "0")}`;

/**
 * Everything the authored CSS is compiled against, minus the components themselves.
 *
 * It has to be everything: `@utility` and `@custom-variant` definitions resolve names the lists
 * use, and the theme decides what `rounded-component` and `text-sm` substitute to. Leaving the
 * components out keeps the output small — they contribute nothing an `@apply` can name.
 */
const preamble = () =>
  [
    `@import "tailwindcss/theme.css" layer(theme);`,
    `@import "tailwindcss/utilities.css" layer(utilities);`,
    `@import "${stylesRoot}/themes/shared/theme.css";`,
    `@import "${stylesRoot}/themes/default.css";`,
    `@import "${stylesRoot}/themes/shared/tokens.css";`,
    `@import "${stylesRoot}/utilities/index.css";`,
    `@import "${stylesRoot}/variants/index.css";`,
  ].join("\n");

function cliPath() {
  const manifest = require.resolve("@tailwindcss/cli/package.json");

  return path.resolve(path.dirname(manifest), require(manifest).bin.tailwindcss);
}

/**
 * Compiles a stylesheet given as text.
 *
 * The input sits beside the real stylesheets because its `@import`s are resolved relative to it
 * and Tailwind's own bare specifiers need this package's `node_modules`; the compile runs from an
 * empty directory so automatic source detection finds nothing to scan.
 */
export function compileCss(css) {
  const input = path.join(stylesRoot, ".oracle-probe.css");
  const scratch = mkdtempSync(path.join(tmpdir(), "ropav-oracle-"));
  const output = path.join(scratch, "out.css");

  try {
    writeFileSync(input, css);
    execFileSync(process.execPath, [cliPath(), "-i", input, "-o", output], {
      cwd: scratch,
      stdio: ["ignore", "ignore", "inherit"],
    });

    return readFileSync(output, "utf8");
  } finally {
    rmSync(input, { force: true });
    rmSync(scratch, { force: true, recursive: true });
  }
}

/** Rebuilds a compiled rule as a node that can sit inside the rule the `@apply` was written in. */
const rerooted = (rule, probe) => {
  const selector = rule.selector.replaceAll(probe, "&");
  // A bare marker means the declarations belong to the host element; anything else is a nested
  // selector the variant produced.
  let node = selector === "&" ? rule.nodes : [rule.clone({ selector })];

  for (let at = rule.parent; at && at.type === "atrule"; at = at.parent) {
    if (at.name === "layer") continue;
    node = [at.clone({ nodes: Array.isArray(node) ? node : [node] })];
  }

  return Array.isArray(node) ? node : [node];
};

/**
 * Expands every list, returning the CSS body each one stands for.
 *
 * One compile for all of them: the preamble costs far more than the probes, and asking 676 times
 * would take minutes rather than a second.
 */
export function expandApplyLists(lists) {
  const unique = [...new Set(lists)];
  const probes = unique.map((list, index) => `.rp-probe-${String(index).padStart(4, "0")}`);

  const css = [
    preamble(),
    "",
    ...unique.map(
      (list, index) => `@layer components {\n${marker(index)} {\n@apply ${list};\n}\n}`,
    ),
  ].join("\n");

  const root = postcss.parse(compileCss(css));
  const collected = new Map(unique.map((list) => [list, []]));

  root.walkRules((rule) => {
    const index = probes.findIndex((probe) => rule.selector.includes(probe));

    if (index === -1) return;
    // A nested rule arrives with its parent; only the outermost mention starts a reconstruction.
    if (rule.parent?.type === "rule") return;

    collected.get(unique[index]).push(...rerooted(rule, probes[index]));
  });

  const expanded = new Map();

  for (const [list, nodes] of collected) {
    if (nodes.length === 0) throw new Error(`Tailwind emitted nothing for \`@apply ${list}\``);

    const holder = postcss.root({ nodes });

    expanded.set(list, holder.toString());
  }

  return expanded;
}
