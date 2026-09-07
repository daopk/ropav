import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import postcss from "postcss";
import { describe, expect, it } from "vitest";

/**
 * Every theme token carries the prefix, and its bare name is gone from the repository.
 *
 * A token declared bare on `:root` is not ours alone. Tailwind's own theme block declares
 * `--spacing`, the type scale, the weights and the container widths on `:root, :host` in the same
 * `@layer theme` — equal specificity, so which of the two answered a component was decided by
 * import order. shadcn's vocabulary overlaps further, on names Tailwind does not declare at all:
 * `--background`, `--foreground`, `--muted`, `--accent`, `--border`. Neither collision raises
 * anything. `token-vocabulary.test.ts` is the check that those namespaces stay unclaimed; this is
 * the check that the rename which vacated them left nothing behind.
 *
 * The second direction is the one no other test can do. A file the rename skipped entirely is
 * internally consistent — every read in it names the same absent token — so it mounts, it renders,
 * and it passes the audits. Only a sweep for the old spelling finds it, and only a sweep over
 * every tracked file finds the ones in `docs`, `storybook` and `testing`, which nothing else here
 * reads.
 *
 * `git ls-files` rather than a directory walk, deliberately: `docs/.vitepress/dist`,
 * `styles/dist`, `ropav/dist` and `storybook-static` all sit in the working tree full of
 * pre-rename names, and a walk would read them and report a repository-wide failure for build
 * output nobody ships from source.
 */
const PREFIX = "--rp-";

const REPO = execSync("git rev-parse --show-toplevel", {
  cwd: import.meta.dirname,
  encoding: "utf8",
}).trim();

const tracked = (pathspec = "") =>
  execSync(`git ls-files ${pathspec}`, { cwd: REPO, encoding: "utf8", maxBuffer: 1 << 28 })
    .trim()
    .split("\n")
    .filter(Boolean);

const themeSheets = tracked("packages/styles/themes").filter((file) => file.endsWith(".css"));

const declared = new Set<string>();

for (const file of themeSheets) {
  postcss.parse(readFileSync(path.join(REPO, file), "utf8")).walkDecls((decl) => {
    if (decl.prop.startsWith("--")) declared.add(decl.prop);
  });
}

/**
 * The boundary is the whole defence, and it is what makes an allowlist enough. `--danger`
 * preceded by a word character is `.rp-badge--danger`, a class modifier and not a property; the
 * trailing half is what keeps `--danger` from matching inside `--danger-soft`, and `--text-sm`
 * from matching inside `--text-sm--line-height`.
 */
const stems = [...declared]
  .filter((name) => name.startsWith(PREFIX))
  .map((name) => name.slice(PREFIX.length))
  .sort((a, b) => b.length - a.length);

const escape = (stem: string) => stem.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
const BARE = new RegExp(`(?<![\\w-])--(?:${stems.map(escape).join("|")})(?![\\w-])`, "g");

const residue: string[] = [];

for (const file of tracked()) {
  let text: string;

  try {
    text = readFileSync(path.join(REPO, file), "utf8");
  } catch {
    continue;
  }

  for (const match of text.matchAll(BARE)) {
    const line = text.slice(0, match.index).split("\n").length;

    residue.push(`${file}:${line} ${match[0]}`);
  }
}

describe("theme tokens", () => {
  it("all carry the prefix", () => {
    // Vacuous unless the themes were actually read.
    expect({
      bare: [...declared].filter((name) => !name.startsWith(PREFIX)),
      sheets: themeSheets.length > 8,
    }).toEqual({ bare: [], sheets: true });
  });

  it("are spelled the one way everywhere the repository names them", () => {
    expect({ read: stems.length > 100, residue }).toEqual({ read: true, residue: [] });
  });
});
